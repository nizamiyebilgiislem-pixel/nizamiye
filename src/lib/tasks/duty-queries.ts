import { cache } from "react";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type DutyTeacher = {
  id: string;
  personName: string;
  date: string;
  note: string | null;
};

export type DutyStudent = {
  id: string;
  studentName: string;
  className: string;
  date: string;
  note: string | null;
};

export async function getTodayDutyTeachers() {
  const supabase = createSupabaseAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data } = await supabase
    .from("tasks")
    .select("id, title, description, due_date, assignee:assigned_to(id, full_name)")
    .ilike("title", "Nöbetçi%")
    .eq("is_active", true)
    .neq("status", "cancelled")
    .order("created_at", { ascending: false });

  if (!data) return [];

  return data
    .filter((t: { due_date: string | null }) => t.due_date === today)
    .map((t: { id: string; title: string; description: string | null; assignee: { id: string; full_name: string } | null }) => ({
      id: t.id,
      personName: t.assignee?.full_name ?? "Bilinmeyen",
      date: today,
      note: t.description,
    })) as DutyTeacher[];
}

export async function getTodayDutyStudents() {
  const supabase = createSupabaseAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data } = await supabase
    .from("student_tasks")
    .select("*, student:student_id(id, full_name, course_class_id), class:course_class_id(id, name)")
    .eq("task_type", "duty")
    .eq("status", "pending")
    .eq("due_date", today)
    .order("created_at", { ascending: false });

  if (!data) return [];

  return data.map((t: { id: string; student: { full_name: string; course_class_id: string | null } | null; due_date: string; description: string | null; class: { name: string } | null }) => ({
    id: t.id,
    studentName: t.student?.full_name ?? "Bilinmeyen",
    className: t.class?.name ?? "",
    date: t.due_date,
    note: t.description,
  })) as DutyStudent[];
}

export const getTodayDuties = cache(async () => {
  const [teachers, students] = await Promise.all([
    getTodayDutyTeachers(),
    getTodayDutyStudents(),
  ]);
  return { teachers, students };
});
