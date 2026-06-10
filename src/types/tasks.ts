import type { Timestamp, DateString } from "@/types/database";

export type TaskPriority = "low" | "normal" | "high" | "urgent";
export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled";

export type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  assigned_by: string;
  assigned_to: string;
  department_id: string | null;
  due_date: DateString | null;
  completed_at: Timestamp | null;
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type TaskCommentRow = {
  id: string;
  task_id: string;
  profile_id: string;
  comment: string;
  created_at: Timestamp;
};

export type TaskAttachmentRow = {
  id: string;
  task_id: string;
  file_name: string;
  file_url: string;
  uploaded_by: string;
  created_at: Timestamp;
};

export const statusLabels: Record<TaskStatus, string> = {
  pending: "Bekliyor",
  in_progress: "Devam Ediyor",
  completed: "Tamamlandı",
  cancelled: "İptal Edildi",
};

export const statusColors: Record<TaskStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  in_progress: "bg-blue-100 text-blue-800 border-blue-300",
  completed: "bg-green-100 text-green-800 border-green-300",
  cancelled: "bg-red-100 text-red-800 border-red-300",
};

export const priorityLabels: Record<TaskPriority, string> = {
  low: "Düşük",
  normal: "Normal",
  high: "Yüksek",
  urgent: "Acil",
};

export const priorityColors: Record<TaskPriority, string> = {
  low: "bg-gray-100 text-gray-700 border-gray-300",
  normal: "bg-blue-50 text-blue-700 border-blue-300",
  high: "bg-orange-100 text-orange-700 border-orange-300",
  urgent: "bg-red-100 text-red-700 border-red-300",
};

export type TaskWithRelations = TaskRow & {
  assigner: { id: string; full_name: string } | null;
  assignee: { id: string; full_name: string } | null;
  department: { id: string; name: string } | null;
  comments: (TaskCommentRow & { profile: { id: string; full_name: string; photo_url: string | null } })[];
  attachments: (TaskAttachmentRow & { uploader: { id: string; full_name: string } })[];
};

export type TaskWithProfiles = TaskRow & {
  assigner: { id: string; full_name: string } | null;
  assignee: { id: string; full_name: string } | null;
  department: { id: string; name: string } | null;
};
