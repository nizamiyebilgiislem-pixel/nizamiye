"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAuth } from "@/lib/auth";
import { buildAuditActor } from "@/lib/audit/log";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { canCreateStudentTask, canDeleteStudentTask, canManageStudentTask } from "@/lib/student-tasks/permissions";

const createStudentTaskSchema = z.object({
  student_id: z.string().uuid("Öğrenci seçilmelidir."),
  title: z.string().trim().min(2, "Görev başlığı en az 2 karakter olmalıdır."),
  description: z.string().nullable(),
  task_type: z.enum(["duty", "rotation", "cleaning", "food", "other"]).default("duty"),
  due_date: z.string().nullable(),
});

const taskTypeLabels: Record<string, string> = {
  duty: "Nöbet/Görev",
  rotation: "Rotasyon",
  cleaning: "Temizlik",
  food: "Yemek",
  other: "Diğer",
};

async function createStudentTaskNotification(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  studentName: string,
  teacherId: string,
  action: "created" | "completed"
) {
  const title = action === "created"
    ? "Yeni Öğrenci Görevi"
    : "Öğrenci Görevi Tamamlandı";

  const message = action === "created"
    ? `"${studentName}" öğrencisine yeni görev atandı.`
    : `"${studentName}" öğrencisinin görevi tamamlandı.`;

  await supabase.from("notifications").insert({
    profile_id: teacherId,
    type: "info",
    title,
    message,
  });
}

export async function createStudentTaskAction(formData: FormData) {
  const { profile } = await requireAuth();
  const actor = buildAuditActor(profile);

  if (!canCreateStudentTask(profile)) {
    throw new Error("Bu işlem için yetkiniz yok.");
  }

  const rawData = {
    student_id: formData.get("student_id"),
    title: formData.get("title"),
    description: formData.get("description") || null,
    task_type: formData.get("task_type") || "duty",
    due_date: formData.get("due_date") || null,
  };

  const parsed = createStudentTaskSchema.safeParse(rawData);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message);
  }

  const supabase = await createSupabaseServerClient();

  const permResult = await canManageStudentTask(supabase, profile, parsed.data.student_id);
  if (permResult.error) {
    throw new Error(permResult.error.message);
  }

  const { data: student } = await supabase
    .from("students")
    .select("full_name, course_class:classes(class_teacher_id)")
    .eq("id", parsed.data.student_id)
    .single() as { data: { full_name: string; course_class: { class_teacher_id: string } | null } | null };

  const { error } = await supabase.from("student_tasks").insert({
    student_id: parsed.data.student_id,
    assigned_by: profile.id,
    title: parsed.data.title,
    description: parsed.data.description,
    task_type: parsed.data.task_type,
    due_date: parsed.data.due_date,
    status: "pending",
  });

  if (error) {
    throw new Error(error.message);
  }

  if (student?.course_class?.class_teacher_id) {
    await createStudentTaskNotification(
      supabase,
      student.full_name,
      student.course_class.class_teacher_id,
      "created"
    );
  }

  revalidatePath("/gorevler");
  return;
}

export async function completeStudentTaskAction(taskId: string) {
  const { profile } = await requireAuth();

  if (!canCreateStudentTask(profile)) {
    throw new Error("Bu işlem için yetkiniz yok.");
  }

  const supabase = await createSupabaseServerClient();

  const { data: task } = await supabase
    .from("student_tasks")
    .select("id, student_id")
    .eq("id", taskId)
    .single();

  if (!task) {
    throw new Error("Görev bulunamadı.");
  }

  const permResult = await canManageStudentTask(supabase, profile, task.student_id);
  if (permResult.error) {
    throw new Error(permResult.error.message);
  }

  const { error } = await supabase
    .from("student_tasks")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", taskId);

  if (error) {
    throw new Error(error.message);
  }

  const { data: student } = await supabase
    .from("students")
    .select("full_name, course_class:classes(class_teacher_id)")
    .eq("id", task.student_id)
    .single() as { data: { full_name: string; course_class: { class_teacher_id: string } | null } | null };

  if (student?.course_class?.class_teacher_id) {
    await createStudentTaskNotification(
      supabase,
      student.full_name,
      student.course_class.class_teacher_id,
      "completed"
    );
  }

  revalidatePath("/gorevler");
  return;
}

export async function deleteStudentTaskAction(taskId: string) {
  const { profile } = await requireAuth();

  const supabase = await createSupabaseServerClient();

  const { data: task } = await supabase
    .from("student_tasks")
    .select("id, assigned_by")
    .eq("id", taskId)
    .single();

  if (!task) {
    throw new Error("Görev bulunamadı.");
  }

  if (!canDeleteStudentTask(profile, task)) {
    throw new Error("Bu görevi silme yetkiniz yok.");
  }

  const { error } = await supabase
    .from("student_tasks")
    .delete()
    .eq("id", taskId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/gorevler");
  return;
}

export async function reassignStudentTaskAction(taskId: string, newStudentId: string) {
  const { profile } = await requireAuth();

  if (!canCreateStudentTask(profile)) {
    throw new Error("Bu işlem için yetkiniz yok.");
  }

  const supabase = await createSupabaseServerClient();

  const { data: task } = await supabase
    .from("student_tasks")
    .select("id, student_id")
    .eq("id", taskId)
    .single();

  if (!task) {
    throw new Error("Görev bulunamadı.");
  }

  const permResult = await canManageStudentTask(supabase, profile, task.student_id);
  if (permResult.error) {
    throw new Error(permResult.error.message);
  }

  const { error } = await supabase
    .from("student_tasks")
    .update({ student_id: newStudentId })
    .eq("id", taskId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/gorevler");
  return;
}

export { taskTypeLabels };