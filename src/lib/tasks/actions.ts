"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAuth } from "@/lib/auth";
import { buildAuditActor, createAuditLog } from "@/lib/audit/log";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { canCreateTask, canAssignToProfile, canEditTask, canUpdateTaskStatus, canCommentOnTask, canDeleteTask, isAssignableRole } from "@/lib/tasks/permissions";
import { logSupabaseActionError, buildFriendlyDbErrorMessage } from "@/lib/supabase-action-error";
import { createNotification } from "@/lib/notifications/actions";
import type { TaskRow } from "@/types/database";

const createTaskSchema = z.object({
  title: z.string().min(1, "Başlık zorunludur."),
  description: z.string().optional(),
  priority: z.string().optional(),
  assigned_to: z.string().min(1, "Atanacak kişi zorunludur."),
  department_id: z.string().optional(),
  due_date: z.string().optional(),
});

const updateStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "in_progress", "completed", "cancelled"]),
});

const editTaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, "Başlık zorunludur."),
  description: z.string().optional(),
  priority: z.string().optional(),
  assigned_to: z.string().optional(),
  department_id: z.string().optional(),
  due_date: z.string().optional(),
});

const addCommentSchema = z.object({
  task_id: z.string().uuid(),
  comment: z.string().min(1, "Yorum zorunludur."),
});

export async function createTaskAction(_previousState: unknown, formData: FormData) {
  const { profile } = await requireAuth();

  if (!canCreateTask(profile)) {
    return { error: "Bu işlem için yetkiniz bulunmamaktadır." };
  }

  const raw = Object.fromEntries(formData);
  const parsed = createTaskSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues.map((e) => e.message).join(", ") };
  }

  const { title, description, priority, assigned_to, department_id, due_date } = parsed.data;

  const supabase = createSupabaseAdminClient();

  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", assigned_to)
    .single();

  if (!targetProfile) {
    return { error: "Atanacak kullanıcı bulunamadı." };
  }

  if (!targetProfile.is_active) {
    return { error: "Pasif kullanıcıya görev atanamaz." };
  }

  if (!isAssignableRole(targetProfile.role)) {
    return { error: "Bu kullanıcıya görev atanamaz." };
  }

  if (!canAssignToProfile(profile, targetProfile)) {
    return { error: "Bu kişiye görev atama yetkiniz bulunmamaktadır." };
  }

  const { data: task, error } = await supabase
    .from("tasks")
    .insert({
      title,
      description: description || null,
      priority: priority || "normal",
      assigned_by: profile.id,
      assigned_to,
      department_id: department_id || null,
      due_date: due_date || null,
    })
    .select("id")
    .single();

  if (error) {
    logSupabaseActionError({ action: "createTask", profile, payload: parsed.data, error });
    return { error: buildFriendlyDbErrorMessage(error) };
  }

  if (assigned_to !== profile.id) {
    await createNotification({
      profileId: assigned_to,
      type: "info",
      moduleKey: "tasks",
      title: `Yeni görev: ${title}`,
      message: `Size "${title}" görevi atandı.`,
    });
  }

  createAuditLog({
    ...buildAuditActor(profile),
    action: "task_created",
    entityType: "task",
    entityId: task.id,
    title: "Görev oluşturuldu",
    description: `"${title}" görevi oluşturuldu.`,
  });

  revalidatePath("/gorevler");
  return { success: true, taskId: task.id };
}

export async function updateTaskStatusAction(_previousState: unknown, formData: FormData) {
  const { profile } = await requireAuth();

  const supabase = createSupabaseAdminClient();

  const raw = Object.fromEntries(formData);
  const parsed = updateStatusSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues.map((e) => e.message).join(", ") };
  }

  const { id, status } = parsed.data;

  const { data: task } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", id)
    .single();

  if (!task) {
    return { error: "Görev bulunamadı." };
  }

  if (!canUpdateTaskStatus(profile, task)) {
    return { error: "Bu işlem için yetkiniz bulunmamaktadır." };
  }

  const updateFields: Partial<TaskRow> = { status };

  if (status === "completed") {
    updateFields.completed_at = new Date().toISOString();
  } else if (task.status === "completed") {
    updateFields.completed_at = null;
  }

  const { error } = await supabase
    .from("tasks")
    .update(updateFields as { status: string; completed_at?: string | null })
    .eq("id", id);

  if (error) {
    logSupabaseActionError({ action: "updateTaskStatus", profile, payload: parsed.data, error });
    return { error: buildFriendlyDbErrorMessage(error) };
  }

  const actionLabel = status === "completed" ? "task_completed" : status === "cancelled" ? "task_cancelled" : "task_updated";

  createAuditLog({
    ...buildAuditActor(profile),
    action: actionLabel,
    entityType: "task",
    entityId: id,
    title: status === "completed" ? "Görev tamamlandı" : status === "cancelled" ? "Görev iptal edildi" : "Görev durumu güncellendi",
    description: `"${task.title}" görevi "${status}" durumuna güncellendi.`,
  });

  revalidatePath("/gorevler");
  return { success: true };
}

export async function editTaskAction(_previousState: unknown, formData: FormData) {
  const { profile } = await requireAuth();

  const supabase = createSupabaseAdminClient();

  const raw = Object.fromEntries(formData);
  const parsed = editTaskSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues.map((e) => e.message).join(", ") };
  }

  const { id, title, description, priority, assigned_to, department_id, due_date } = parsed.data;

  const { data: task } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", id)
    .single();

  if (!task) {
    return { error: "Görev bulunamadı." };
  }

  if (!canEditTask(profile, task)) {
    return { error: "Bu işlem için yetkiniz bulunmamaktadır." };
  }

  const updateFields: Partial<TaskRow> = {
    title,
    description: description || null,
    priority: priority || "normal",
    due_date: due_date || null,
  };

  if (assigned_to) {
    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", assigned_to)
      .single();

    if (!targetProfile) {
      return { error: "Atanacak kullanıcı bulunamadı." };
    }

    if (!targetProfile.is_active) {
      return { error: "Pasif kullanıcıya görev atanamaz." };
    }

    if (!isAssignableRole(targetProfile.role)) {
      return { error: "Bu kullanıcıya görev atanamaz." };
    }

    if (!canAssignToProfile(profile, targetProfile)) {
      return { error: "Bu kişiye görev atama yetkiniz bulunmamaktadır." };
    }

    updateFields.assigned_to = assigned_to;
  }

  if (department_id !== undefined) {
    updateFields.department_id = department_id || null;
  }

  const { error } = await supabase
    .from("tasks")
    .update(updateFields)
    .eq("id", id);

  if (error) {
    logSupabaseActionError({ action: "editTask", profile, payload: parsed.data, error });
    return { error: buildFriendlyDbErrorMessage(error) };
  }

  if (assigned_to && assigned_to !== profile.id && assigned_to !== task.assigned_to) {
    await createNotification({
      profileId: assigned_to,
      type: "info",
      moduleKey: "tasks",
      title: `Görev güncellendi: ${title}`,
      message: `Size "${title}" görevi atandı.`,
    });
  }

  createAuditLog({
    ...buildAuditActor(profile),
    action: "task_updated",
    entityType: "task",
    entityId: id,
    title: "Görev güncellendi",
    description: `"${title}" görevi güncellendi.`,
  });

  revalidatePath("/gorevler");
  return { success: true };
}

export async function addCommentAction(_previousState: unknown, formData: FormData) {
  const { profile } = await requireAuth();

  const supabase = createSupabaseAdminClient();

  const raw = Object.fromEntries(formData);
  const parsed = addCommentSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues.map((e) => e.message).join(", ") };
  }

  const { task_id, comment } = parsed.data;

  const { data: task } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", task_id)
    .single();

  if (!task) {
    return { error: "Görev bulunamadı." };
  }

  if (!canCommentOnTask(profile, task)) {
    return { error: "Bu göreve yorum yapma yetkiniz bulunmamaktadır." };
  }

  const { error } = await supabase
    .from("task_comments")
    .insert({
      task_id,
      profile_id: profile.id,
      comment,
    });

  if (error) {
    logSupabaseActionError({ action: "addComment", profile, payload: parsed.data, error });
    return { error: buildFriendlyDbErrorMessage(error) };
  }

  createAuditLog({
    ...buildAuditActor(profile),
    action: "task_comment_added",
    entityType: "task",
    entityId: task_id,
    title: "Yorum eklendi",
    description: `"${task.title}" görevine yorum eklendi.`,
  });

  revalidatePath(`/gorevler/${task_id}`);
  return { success: true };
}

export async function deleteTaskAction(_previousState: unknown, formData: FormData) {
  const { profile } = await requireAuth();

  const supabase = createSupabaseAdminClient();
  const taskId = formData.get("id") as string;

  if (!taskId) {
    return { error: "Görev ID gerekli." };
  }

  const { data: task, error: findError } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .maybeSingle();

  if (findError || !task) {
    return { error: "Görev bulunamadı." };
  }

  if (!canDeleteTask(profile, task)) {
    return { error: "Bu işlem için yetkiniz bulunmamaktadır." };
  }

  const { error } = await supabase
    .from("tasks")
    .update({ is_active: false })
    .eq("id", taskId);

  if (error) {
    logSupabaseActionError({ action: "deleteTask", profile, payload: { taskId }, error });
    return { error: buildFriendlyDbErrorMessage(error) };
  }

  if (task.assigned_to && task.assigned_to !== profile.id) {
    await createNotification({
      profileId: task.assigned_to,
      type: "warning",
      moduleKey: "tasks",
      title: `Görev silindi: ${task.title}`,
      message: `"${task.title}" görevi silindi.`,
    });
  }

  createAuditLog({
    ...buildAuditActor(profile),
    action: "task_deleted",
    entityType: "task",
    entityId: taskId,
    title: "Görev silindi",
    description: `"${task.title}" görevi silindi.`,
  });

  revalidatePath("/gorevler");
  return { success: true };
}
