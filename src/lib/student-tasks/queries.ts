import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProfileRow, StudentTaskRow } from "@/types/database";

export type StudentTaskWithStudent = StudentTaskRow & {
  student: {
    id: string;
    full_name: string;
    photo_url: string | null;
    course_class: {
      id: string;
      name: string;
      department_id: string;
    } | null;
  };
  assigned_by_profile: {
    id: string;
    full_name: string;
  } | null;
};

export type StudentTaskFilters = {
  status?: string;
  student_id?: string;
  due_date?: string;
};

export async function getStudentTasks(
  profile: ProfileRow,
  filters: StudentTaskFilters = {},
): Promise<{ data: StudentTaskWithStudent[]; count: number }> {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("student_tasks")
    .select(`
      *,
      student:students!inner(
        id,
        full_name,
        photo_url,
        course_class:classes!inner(id, name, department_id)
      ),
      assigned_by_profile:profiles!student_tasks_assigned_by_fkey(id, full_name)
    `, { count: "exact" })
    .eq("status", (filters.status ?? "pending") as "pending" | "completed")
    .order("due_date", { ascending: true, nullsFirst: false });

  if (filters.student_id) {
    query = query.eq("student_id", filters.student_id);
  }

  if (filters.due_date) {
    query = query.eq("due_date", filters.due_date);
  }

  const { data, count, error } = await query;

  if (error) {
    throw new Error("Öğrenci görevleri alınamadı.");
  }

  return { data: (data ?? []) as unknown as StudentTaskWithStudent[], count: count ?? 0 };
}

export async function getStudentTaskById(taskId: string) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("student_tasks")
    .select(`
      *,
      student:students!inner(
        id,
        full_name,
        photo_url,
        course_class:classes!inner(id, name, department_id)
      ),
      assigned_by_profile:profiles!student_tasks_assigned_by_fkey(id, full_name)
    `)
    .eq("id", taskId)
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as unknown as StudentTaskWithStudent, error: null };
}

export async function getStudentTaskStats(profile: ProfileRow) {
  const supabase = await createSupabaseServerClient();

  const { data: allTasks } = await supabase
    .from("student_tasks")
    .select("status, due_date, student:students(course_class_id, course_class:classes(class_teacher_id, department_id))");

  if (!allTasks) {
    return { pending: 0, completed: 0, overdue: 0, dueToday: 0 };
  }

  const today = new Date().toISOString().split("T")[0];

  const filteredTasks = allTasks.filter((task: any) => {
    if (["admin", "genel_mudur"].includes(profile.role)) return true;
    if (profile.role === "bolum_muduru") {
      return task.student?.course_class?.department_id === profile.department_id;
    }
    if (profile.role === "hoca") {
      return task.student?.course_class?.class_teacher_id === profile.id;
    }
    return false;
  });

  const pending = filteredTasks.filter((t: any) => t.status === "pending").length;
  const completed = filteredTasks.filter((t: any) => t.status === "completed").length;
  const overdue = filteredTasks.filter((t: any) =>
    t.status === "pending" && t.due_date && t.due_date < today
  ).length;
  const dueToday = filteredTasks.filter((t: any) =>
    t.status === "pending" && t.due_date === today
  ).length;

  return { pending, completed, overdue, dueToday };
}

export async function getStudentsForTaskAssignment(profile: ProfileRow) {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("students")
    .select(`
      id,
      full_name,
      photo_url,
      course_class:classes!inner(id, name, department_id, class_teacher_id)
    `)
    .eq("status", "active");

  if (profile.role === "bolum_muduru" && profile.department_id) {
    query = query.eq("course_class.department_id", profile.department_id);
  }

  if (profile.role === "hoca" && profile.id) {
    query = query.eq("course_class.class_teacher_id", profile.id);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("Öğrenci listesi alınamadı.");
  }

  return data as unknown as Array<{
    id: string;
    full_name: string;
    photo_url: string | null;
    course_class: {
      id: string;
      name: string;
      department_id: string;
      class_teacher_id: string;
    };
  }>;
}