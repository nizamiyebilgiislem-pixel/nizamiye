"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAuth } from "@/lib/auth";
import { buildAuditActor, createAuditLog } from "@/lib/audit/log";
import { canEditInfirmaryRecord } from "@/lib/infirmary/permissions";
import { canManageInfirmary } from "@/lib/module-assignments/permissions";
import { getInfirmaryRecordById } from "@/lib/infirmary/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getStudentById } from "@/lib/students/queries";

const text = z.preprocess((value) => (typeof value === "string" && value.trim() === "" ? null : value), z.string().nullable());

const recordSchema = z
  .object({
    student_id: z.string().uuid(),
    record_date: z.string().min(1, "Kayıt tarihi zorunludur."),
    complaint: text,
    treatment: text,
    sent_to_hospital: z.enum(["true", "false"]).default("false"),
    hospital_name: text,
    medication_given: text,
    parent_informed: z.enum(["true", "false"]).default("false"),
    note: text,
  })
  .superRefine((data, context) => {
    if (!data.complaint && !data.treatment && !data.note) {
      context.addIssue({ code: "custom", message: "Şikayet, tedavi veya not alanlarından en az biri doldurulmalıdır." });
    }
  });

const updateSchema = recordSchema.extend({ id: z.string().uuid() });

export async function createInfirmaryRecordAction(formData: FormData) {
  const { profile } = await requireAuth();
  const parsed = recordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(`/revir/yeni?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Form hatalı.")}`);
  const student = await getStudentById(parsed.data.student_id);
  if (!student) redirect("/revir/yeni?error=not-found");
  if (!canEditInfirmaryRecord(profile, student, student.course_class) && !(await canManageInfirmary(profile))) redirect("/revir/yeni?error=unauthorized");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("infirmary_records").insert({
    student_id: student.id,
    record_date: parsed.data.record_date,
    complaint: parsed.data.complaint,
    treatment: parsed.data.treatment,
    sent_to_hospital: parsed.data.sent_to_hospital === "true",
    hospital_name: parsed.data.hospital_name,
    medication_given: parsed.data.medication_given,
    parent_informed: parsed.data.parent_informed === "true",
    note: parsed.data.note,
    created_by: profile.id,
  }).select("id").single();
  if (error || !data) redirect("/revir/yeni?error=save");

  await createAuditLog({
    ...buildAuditActor(profile),
    action: "infirmary_record_saved",
    title: "Revir kaydı oluşturuldu/güncellendi",
    description: `${student.full_name} için yeni revir kaydı oluşturuldu.`,
    entityType: "infirmary_record",
    entityId: data.id,
    studentId: student.id,
    beforeData: null,
    afterData: {
      student_id: student.id,
      record_date: parsed.data.record_date,
      complaint: parsed.data.complaint,
      treatment: parsed.data.treatment,
      sent_to_hospital: parsed.data.sent_to_hospital === "true",
      hospital_name: parsed.data.hospital_name,
      medication_given: parsed.data.medication_given,
      parent_informed: parsed.data.parent_informed === "true",
      note: parsed.data.note,
    },
  });

  revalidatePath("/revir");
  revalidatePath(`/talebeler/${student.id}`);
  redirect(`/revir/${data.id}?success=created`);
}

export async function updateInfirmaryRecordAction(formData: FormData) {
  const { profile } = await requireAuth();
  const parsed = updateSchema.safeParse(Object.fromEntries(formData));
  const fallbackId = String(formData.get("id") ?? "");
  if (!parsed.success) redirect(`/revir/${fallbackId}/duzenle?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Form hatalı.")}`);
  const record = await getInfirmaryRecordById(parsed.data.id);
  if (!record?.student) redirect("/revir/kayitlar?error=not-found");
  if (!canEditInfirmaryRecord(profile, record.student, record.course_class) && !(await canManageInfirmary(profile))) redirect(`/revir/${record.id}?error=unauthorized`);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("infirmary_records").update({
    record_date: parsed.data.record_date,
    complaint: parsed.data.complaint,
    treatment: parsed.data.treatment,
    sent_to_hospital: parsed.data.sent_to_hospital === "true",
    hospital_name: parsed.data.hospital_name,
    medication_given: parsed.data.medication_given,
    parent_informed: parsed.data.parent_informed === "true",
    note: parsed.data.note,
  }).eq("id", record.id);
  if (error) redirect(`/revir/${record.id}/duzenle?error=save`);

  await createAuditLog({
    ...buildAuditActor(profile),
    action: "infirmary_record_saved",
    title: "Revir kaydı oluşturuldu/güncellendi",
    description: `${record.student.full_name} için revir kaydı güncellendi.`,
    entityType: "infirmary_record",
    entityId: record.id,
    studentId: record.student.id,
    beforeData: record,
    afterData: {
      record_date: parsed.data.record_date,
      complaint: parsed.data.complaint,
      treatment: parsed.data.treatment,
      sent_to_hospital: parsed.data.sent_to_hospital === "true",
      hospital_name: parsed.data.hospital_name,
      medication_given: parsed.data.medication_given,
      parent_informed: parsed.data.parent_informed === "true",
      note: parsed.data.note,
    },
  });

  revalidatePath("/revir");
  revalidatePath(`/revir/${record.id}`);
  revalidatePath(`/talebeler/${record.student.id}`);
  redirect(`/revir/${record.id}?success=updated`);
}
