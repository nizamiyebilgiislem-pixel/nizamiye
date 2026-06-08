"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAuth } from "@/lib/auth";
import { buildAuditActor, createAuditLog } from "@/lib/audit/log";
import { documentTypes } from "@/lib/documents/constants";
import { canEditStudentDocuments } from "@/lib/documents/permissions";
import { getDocumentById } from "@/lib/documents/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getStudentById } from "@/lib/students/queries";

const documentSchema = z.object({
  student_id: z.string().uuid(),
  document_type: z.enum(documentTypes),
  file_url: z.string().trim().url("Geçerli bir dosya URL girilmelidir."),
});

const updateDocumentSchema = documentSchema.omit({ student_id: true }).extend({ id: z.string().uuid() });

export async function createDocumentAction(formData: FormData) {
  const { profile } = await requireAuth();
  const parsed = documentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(`/evraklar/yeni?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Form hatalı.")}`);
  const student = await getStudentById(parsed.data.student_id);
  if (!student) redirect("/evraklar/yeni?error=not-found");
  if (!canEditStudentDocuments(profile, student, student.course_class)) redirect("/evraklar/yeni?error=unauthorized");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("student_documents").insert({
    student_id: student.id,
    document_type: parsed.data.document_type,
    file_url: parsed.data.file_url,
    uploaded_by: profile.id,
  }).select("id").single();
  if (error || !data) redirect("/evraklar/yeni?error=save");

  await createAuditLog({
    ...buildAuditActor(profile),
    action: "document_saved",
    title: "Evrak eklendi/güncellendi",
    description: `${student.full_name} için ${parsed.data.document_type} evrağı işlendi.`,
    entityType: "document",
    entityId: data.id,
    studentId: student.id,
    beforeData: null,
    afterData: {
      student_id: student.id,
      document_type: parsed.data.document_type,
      file_url: parsed.data.file_url,
    },
  });

  revalidatePath("/evraklar");
  revalidatePath(`/talebeler/${student.id}`);
  redirect(`/evraklar/${data.id}`);
}

export async function updateDocumentAction(formData: FormData) {
  const { profile } = await requireAuth();
  const parsed = updateDocumentSchema.safeParse(Object.fromEntries(formData));
  const fallbackId = String(formData.get("id") ?? "");
  if (!parsed.success) redirect(`/evraklar/${fallbackId}/duzenle?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Form hatalı.")}`);
  const document = await getDocumentById(parsed.data.id);
  if (!document?.student) redirect("/evraklar?error=not-found");
  if (!canEditStudentDocuments(profile, document.student, document.course_class)) redirect(`/evraklar/${document.id}?error=unauthorized`);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("student_documents").update({
    document_type: parsed.data.document_type,
    file_url: parsed.data.file_url,
  }).eq("id", document.id);
  if (error) redirect(`/evraklar/${document.id}/duzenle?error=save`);

  await createAuditLog({
    ...buildAuditActor(profile),
    action: "document_saved",
    title: "Evrak eklendi/güncellendi",
    description: `${document.student.full_name} için evrak güncellendi.`,
    entityType: "document",
    entityId: document.id,
    studentId: document.student.id,
    beforeData: document,
    afterData: {
      document_type: parsed.data.document_type,
      file_url: parsed.data.file_url,
    },
  });

  revalidatePath("/evraklar");
  revalidatePath(`/evraklar/${document.id}`);
  revalidatePath(`/talebeler/${document.student.id}`);
  redirect(`/evraklar/${document.id}`);
}
