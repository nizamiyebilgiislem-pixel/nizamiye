"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAuth } from "@/lib/auth";
import { buildAuditActor, createAuditLog } from "@/lib/audit/log";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isAssignableRole } from "@/lib/tasks/permissions";
import { createNotification } from "@/lib/notifications/actions";

const assignTeacherDutySchema = z.object({
  assigned_to: z.string().min(1, "Hoca seçilmedi."),
  date: z.string().min(1, "Tarih zorunludur."),
  note: z.string().optional(),
});

const assignStudentDutySchema = z.object({
  student_id: z.string().min(1, "Öğrenci seçilmedi."),
  date: z.string().min(1, "Tarih zorunludur."),
  note: z.string().optional(),
});

const removeDutySchema = z.object({
  id: z.string().min(1),
  type: z.enum(["teacher", "student"]),
});

export async function assignTeacherDutyAction(_previousState: unknown, formData: FormData) {
  const { profile } = await requireAuth();
  const supabase = createSupabaseAdminClient();

  const raw = Object.fromEntries(formData);
  const parsed = assignTeacherDutySchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues.map((e) => e.message).join(", ") };
  }

  const { assigned_to, date, note } = parsed.data;

  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", assigned_to)
    .single();

  if (!targetProfile || !targetProfile.is_active) {
    return { error: "Geçerli bir hoca bulunamadı." };
  }

  const { data: task, error } = await supabase
    .from("tasks")
    .insert({
      title: `Nöbetçi Hoca - ${date}`,
      description: note || null,
      priority: "normal",
      assigned_by: profile.id,
      assigned_to,
      due_date: date,
    })
    .select("id")
    .single();

  if (error) {
    return { error: "Nöbetçi hocası atanamadı." };
  }

  if (assigned_to !== profile.id) {
    await createNotification({
      profileId: assigned_to,
      type: "info",
      moduleKey: "tasks",
      title: `Nöbetçi hocası atandı - ${date}`,
      message: `${date} tarihinde nöbetçi olarak atandınız.`,
    });
  }

  createAuditLog({
    ...buildAuditActor(profile),
    action: "duty_teacher_assigned",
    entityType: "task",
    entityId: task.id,
    title: "Nöbetçi hocası atandı",
    description: `${targetProfile.full_name} ${date} tarihinde nöbetçi olarak atandı.`,
  });

  revalidatePath("/gorevler/nobetci");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function assignStudentDutyAction(_previousState: unknown, formData: FormData) {
  const { profile } = await requireAuth();
  const supabase = createSupabaseAdminClient();

  const raw = Object.fromEntries(formData);
  const parsed = assignStudentDutySchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues.map((e) => e.message).join(", ") };
  }

  const { student_id, date, note } = parsed.data;

  const { data: student } = await supabase
    .from("students")
    .select("id, full_name")
    .eq("id", student_id)
    .single();

  if (!student) {
    return { error: "Geçerli bir öğrenci bulunamadı." };
  }

  const { data: task, error } = await supabase
    .from("student_tasks")
    .insert({
      student_id,
      assigned_by: profile.id,
      title: `Nöbetçi Talebe - ${date}`,
      description: note || null,
      task_type: "duty",
      due_date: date,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    return { error: "Nöbetçi öğrencisi atanamadı." };
  }

  createAuditLog({
    ...buildAuditActor(profile),
    action: "duty_student_assigned",
    entityType: "student_task",
    entityId: task.id,
    title: "Nöbetçi öğrencisi atandı",
    description: `${student.full_name} ${date} tarihinde nöbetçi olarak atandı.`,
  });

  revalidatePath("/gorevler/nobetci");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function removeDutyAction(_previousState: unknown, formData: FormData) {
  const { profile } = await requireAuth();
  const supabase = createSupabaseAdminClient();

  const raw = Object.fromEntries(formData);
  const parsed = removeDutySchema.safeParse(raw);

  if (!parsed.success) {
    return { error: "Geçersiz istek." };
  }

  const { id, type } = parsed.data;

  let assignedTo: string | null = null;

  if (type === "teacher") {
    const { data: teacherTask } = await supabase
      .from("tasks")
      .select("assigned_to")
      .eq("id", id)
      .single();

    if (teacherTask) {
      assignedTo = teacherTask.assigned_to;
    }

    await supabase.from("tasks").update({ is_active: false }).eq("id", id);
  } else {
    await supabase.from("student_tasks").update({ status: "completed" }).eq("id", id);
  }

  createAuditLog({
    ...buildAuditActor(profile),
    action: "duty_removed",
    entityType: type === "teacher" ? "task" : "student_task",
    entityId: id,
    title: "Nöbetçi kaldırıldı",
    description: "Nöbetçi görevi kaldırıldı.",
  });

  if (type === "teacher" && assignedTo && assignedTo !== profile.id) {
    await createNotification({
      profileId: assignedTo,
      type: "warning",
      moduleKey: "tasks",
      title: "Nöbetçi görevi kaldırıldı",
      message: "Nöbetçi hocası göreviniz kaldırıldı.",
    });
  }

  revalidatePath("/gorevler/nobetci");
  revalidatePath("/dashboard");
  return { success: true };
}
