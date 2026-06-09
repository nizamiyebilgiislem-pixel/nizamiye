"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAuth } from "@/lib/auth";
import { buildAuditActor, createAuditLog } from "@/lib/audit/log";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { canManageDormitories, canManageDormitoryAssignments } from "@/lib/dormitory/permissions";
import { getDormitoryById, getDormitoryAssignmentCount, getStudentActiveAssignment } from "@/lib/dormitory/queries";
import { logSupabaseActionError, buildFriendlyDbErrorMessage } from "@/lib/supabase-action-error";

const createDormitorySchema = z.object({
  department_id: z.string().uuid("Bölüm seçilmelidir."),
  name: z.string().trim().min(1, "Yatakhane adı zorunludur."),
  capacity: z.coerce.number().int("Kapasite tam sayı olmalıdır.").min(1, "Kapasite en az 1 olmalıdır."),
  description: z.string().trim().optional().default(""),
});

const updateDormitorySchema = z.object({
  id: z.string().uuid(),
  department_id: z.string().uuid("Bölüm seçilmelidir."),
  name: z.string().trim().min(1, "Yatakhane adı zorunludur."),
  capacity: z.coerce.number().int("Kapasite tam sayı olmalıdır.").min(1, "Kapasite en az 1 olmalıdır."),
  description: z.string().trim().optional().default(""),
  is_active: z.enum(["true", "false"]),
});

const assignStudentSchema = z.object({
  dormitory_id: z.string().uuid(),
  student_id: z.string().uuid("Talebe seçilmelidir."),
  start_date: z.string().min(1, "Başlangıç tarihi zorunludur."),
  note: z.string().trim().optional().default(""),
});

export async function createDormitoryAction(_previousState: unknown, formData: FormData) {
  const { profile } = await requireAuth();

  if (!canManageDormitories(profile)) {
    return { error: "Bu işlem için yetkiniz bulunmamaktadır." };
  }

  const raw = Object.fromEntries(formData);
  const parsed = createDormitorySchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues.map((e) => e.message).join(", ") };
  }

  const { department_id, name, capacity, description } = parsed.data;

  if (profile.role === "bolum_muduru" && department_id !== profile.department_id) {
    return { error: "Bu işlem için yetkiniz bulunmamaktadır." };
  }

  const supabase = await createSupabaseServerClient();

  const { data: dormitory, error } = await supabase
    .from("dormitories")
    .insert({ department_id, name, capacity, description: description || null, is_active: true })
    .select("id")
    .single();

  if (error) {
    logSupabaseActionError({ action: "createDormitory", profile, payload: parsed.data, error });
    return { error: buildFriendlyDbErrorMessage(error) };
  }

  createAuditLog({
    ...buildAuditActor(profile),
    action: "dormitory_created",
    entityType: "dormitory",
    entityId: dormitory.id,
    title: "Yatakhane oluşturuldu",
    description: `${name} (Kapasite: ${capacity}) oluşturuldu.`,
    afterData: { name, capacity, department_id },
  });

  revalidatePath("/yatakhane");
  redirect("/yatakhane?success=created");
}

export async function updateDormitoryAction(_previousState: unknown, formData: FormData) {
  const { profile } = await requireAuth();

  if (!canManageDormitories(profile)) {
    return { error: "Bu işlem için yetkiniz bulunmamaktadır." };
  }

  const raw = Object.fromEntries(formData);
  const parsed = updateDormitorySchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues.map((e) => e.message).join(", ") };
  }

  const { id, department_id, name, capacity, description, is_active } = parsed.data;

  if (profile.role === "bolum_muduru" && department_id !== profile.department_id) {
    return { error: "Bu işlem için yetkiniz bulunmamaktadır." };
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("dormitories")
    .update({ department_id, name, capacity, description: description || null, is_active: is_active === "true" })
    .eq("id", id);

  if (error) {
    logSupabaseActionError({ action: "updateDormitory", profile, payload: parsed.data, error });
    return { error: buildFriendlyDbErrorMessage(error) };
  }

  createAuditLog({
    ...buildAuditActor(profile),
    action: "dormitory_updated",
    entityType: "dormitory",
    entityId: id,
    title: "Yatakhane güncellendi",
    description: `${name} güncellendi.`,
    afterData: { name, capacity, department_id, is_active: is_active === "true" },
  });

  revalidatePath("/yatakhane");
  revalidatePath(`/yatakhane/${id}`);
  redirect("/yatakhane?success=updated");
}

export async function assignStudentAction(_previousState: unknown, formData: FormData) {
  const { profile } = await requireAuth();

  if (!canManageDormitoryAssignments(profile)) {
    return { error: "Bu işlem için yetkiniz bulunmamaktadır." };
  }

  const raw = Object.fromEntries(formData);
  const parsed = assignStudentSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues.map((e) => e.message).join(", ") };
  }

  const { dormitory_id, student_id, start_date, note } = parsed.data;
  const supabase = await createSupabaseServerClient();

  const dormitory = await getDormitoryById(dormitory_id);

  if (!dormitory) {
    return { error: "Yatakhane bulunamadı." };
  }

  if (profile.role === "bolum_muduru" && dormitory.department_id !== profile.department_id) {
    return { error: "Bu işlem için yetkiniz bulunmamaktadır." };
  }

  const currentCount = await getDormitoryAssignmentCount(dormitory_id);

  if (currentCount >= dormitory.capacity) {
    return { error: "Bu yatakhanenin kapasitesi doludur." };
  }

  const existingAssignment = await getStudentActiveAssignment(student_id);

  if (existingAssignment) {
    return { error: "Bu talebenin zaten aktif bir yatakhane kaydı bulunmaktadır." };
  }

  const { data: assignment, error } = await supabase
    .from("dormitory_assignments")
    .insert({
      dormitory_id,
      student_id,
      start_date,
      note: note || null,
      status: "active",
      assigned_by: profile.id,
    })
    .select("id")
    .single();

  if (error) {
    logSupabaseActionError({ action: "assignStudent", profile, payload: parsed.data, error });
    return { error: buildFriendlyDbErrorMessage(error) };
  }

  createAuditLog({
    ...buildAuditActor(profile),
    action: "dormitory_assignment_created",
    entityType: "dormitory_assignment",
    entityId: assignment.id,
    studentId: student_id,
    title: "Öğrenci yatakhaneye yerleştirildi",
    description: `Öğrenci ${dormitory.name} yatakhanesine yerleştirildi.`,
    afterData: { dormitory_id, student_id, start_date },
  });

  revalidatePath("/yatakhane", "layout");

  return { success: true, dormitory_id };
}

export async function endAssignmentAction(assignmentId: string) {
  const { profile } = await requireAuth();

  if (!canManageDormitoryAssignments(profile)) {
    return { error: "Bu işlem için yetkiniz bulunmamaktadır." };
  }

  const supabase = await createSupabaseServerClient();

  const { data: assignment } = await supabase
    .from("dormitory_assignments")
    .select("dormitory_id, student_id")
    .eq("id", assignmentId)
    .single();

  if (!assignment) {
    return { error: "Yerleşim kaydı bulunamadı." };
  }

  const dormitory = await getDormitoryById(assignment.dormitory_id);

  if (profile.role === "bolum_muduru" && (!dormitory || dormitory.department_id !== profile.department_id)) {
    return { error: "Bu işlem için yetkiniz bulunmamaktadır." };
  }

  const today = new Date().toISOString().split("T")[0];

  const { error } = await supabase
    .from("dormitory_assignments")
    .update({ status: "ended", end_date: today })
    .eq("id", assignmentId)
    .eq("status", "active");

  if (error) {
    logSupabaseActionError({ action: "endAssignment", profile, payload: { assignmentId }, error });
    return { error: buildFriendlyDbErrorMessage(error) };
  }

  createAuditLog({
    ...buildAuditActor(profile),
    action: "dormitory_assignment_ended",
    entityType: "dormitory_assignment",
    entityId: assignmentId,
    title: "Yerleşim sonlandırıldı",
    description: "Öğrencinin yatakhane kaydı sonlandırıldı.",
    afterData: { status: "ended", end_date: today },
  });

  revalidatePath("/yatakhane", "layout");

  return { success: true };
}
