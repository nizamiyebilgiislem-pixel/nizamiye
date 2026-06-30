import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ProfileRow, TaskRow, TaskCommentRow, TaskAttachmentRow } from "@/types/database";
import { isAssignableRole } from "@/lib/tasks/permissions";
import { isGlobalViewRole } from "@/types/rbac";

const taskSelectFields = `
  *,
  assigner:assigned_by(id, full_name),
  assignee:assigned_to(id, full_name),
  department:department_id(id, name)
`;

const commentSelectFields = `
  *,
  profile:profile_id(id, full_name, photo_url)
`;

const attachmentSelectFields = `
  *,
  uploader:uploaded_by(id, full_name)
`;

export async function getTasks(profile: ProfileRow, page?: number, pageSize = 20): Promise<{ data: TaskRowWithProfiles[]; count: number }> {
  const supabase = createSupabaseAdminClient();

  const role = profile.role;

  let query = supabase
    .from("tasks")
    .select(taskSelectFields, { count: "exact" })
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (isGlobalViewRole(role)) {
    // No additional filters needed
  } else if (role === "bolum_muduru" && profile.department_id) {
    query = query.or(`department_id.eq.${profile.department_id},assigned_by.eq.${profile.id},assigned_to.eq.${profile.id}`);
  } else {
    query = query.or(`assigned_to.eq.${profile.id},assigned_by.eq.${profile.id}`);
  }

  if (page !== undefined) {
    const from = (page - 1) * pageSize;
    query = query.range(from, from + pageSize - 1);
  }

  const { data, count } = await query;
  return { data: (data ?? []) as unknown as TaskRowWithProfiles[], count: count ?? 0 };
}

export async function getTaskById(id: string) {
  const supabase = createSupabaseAdminClient();

  const { data: task } = await supabase
    .from("tasks")
    .select(taskSelectFields)
    .eq("id", id)
    .single();

  if (!task) return null;

  const { data: comments } = await supabase
    .from("task_comments")
    .select(commentSelectFields)
    .eq("task_id", id)
    .order("created_at", { ascending: true });

  const { data: attachments } = await supabase
    .from("task_attachments")
    .select(attachmentSelectFields)
    .eq("task_id", id)
    .order("created_at", { ascending: false });

  return {
    ...(task as TaskRowWithProfiles),
    comments: (comments ?? []) as unknown as TaskCommentWithProfile[],
    attachments: (attachments ?? []) as unknown as TaskAttachmentWithProfile[],
  } as TaskWithFullRelations;
}

export async function getDepartmentOptions() {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("departments")
    .select("id, name")
    .eq("is_active", true)
    .order("name", { ascending: true });
  return data ?? [];
}

export async function getAssignableProfiles(currentProfile: ProfileRow) {
  const supabase = createSupabaseAdminClient();

  let query = supabase
    .from("profiles")
    .select("id, full_name, role, department_id")
    .eq("is_active", true);

  if (currentProfile.role === "bolum_muduru") {
    if (!currentProfile.department_id) return [];
    query = query.eq("department_id", currentProfile.department_id);
  } else if (!["admin", "genel_mudur"].includes(currentProfile.role)) {
    return [];
  }

  const { data } = await query.order("full_name", { ascending: true });
  return ((data ?? []) as AssignableProfile[]).filter((p) => isAssignableRole(p.role));
}

export async function getTaskCounts(profile: ProfileRow) {
  const { data: tasks } = await getTasks(profile);

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  return {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === "pending").length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
    cancelled: tasks.filter((t) => t.status === "cancelled").length,
    overdue: tasks.filter((t) => t.due_date && t.due_date < todayStr && t.status !== "completed" && t.status !== "cancelled").length,
    dueToday: tasks.filter((t) => t.due_date === todayStr && t.status !== "completed" && t.status !== "cancelled").length,
    urgent: tasks.filter((t) => t.priority === "urgent" && t.status !== "completed" && t.status !== "cancelled").length,
    myTasks: tasks.filter((t) => t.assigned_to === profile.id && t.status !== "completed" && t.status !== "cancelled").length,
  };
}

export async function getTaskStats() {
  const supabase = createSupabaseAdminClient();

  const { data: tasks } = await supabase
    .from("tasks")
    .select("status, priority, due_date, completed_at, created_at")
    .eq("is_active", true);

  if (!tasks || tasks.length === 0) {
    return { total: 0, open: 0, completed: 0, avgCompletionHours: null };
  }

  const total = tasks.length;
  const open = tasks.filter((t) => t.status !== "completed" && t.status !== "cancelled").length;
  const completed = tasks.filter((t) => t.status === "completed").length;

  const completedTasks = tasks.filter((t) => t.status === "completed" && t.completed_at);
  let avgCompletionHours: number | null = null;

  if (completedTasks.length > 0) {
    const totalHours = completedTasks.reduce((sum, t) => {
      const created = new Date(t.created_at).getTime();
      const completedTime = new Date(t.completed_at!).getTime();
      return sum + (completedTime - created) / (1000 * 60 * 60);
    }, 0);
    avgCompletionHours = Math.round(totalHours / completedTasks.length);
  }

  return { total, open, completed, avgCompletionHours };
}

export type TaskRowWithProfiles = TaskRow & {
  assigner: { id: string; full_name: string } | null;
  assignee: { id: string; full_name: string } | null;
  department: { id: string; name: string } | null;
};

export type TaskCommentWithProfile = TaskCommentRow & {
  profile: { id: string; full_name: string; photo_url: string | null };
};

export type TaskAttachmentWithProfile = TaskAttachmentRow & {
  uploader: { id: string; full_name: string };
};

export type TaskWithFullRelations = TaskRowWithProfiles & {
  comments: TaskCommentWithProfile[];
  attachments: TaskAttachmentWithProfile[];
};

export type AssignableProfile = {
  id: string;
  full_name: string;
  role: string;
  department_id: string | null;
};
