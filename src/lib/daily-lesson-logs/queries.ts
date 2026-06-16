import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { DailyLessonLogRow, ClassCourseRow, ProfileRow } from "@/types/database";

export type DailyLessonLogWithRelations = DailyLessonLogRow & {
  class_course: ClassCourseRow & {
    class: {
      id: string;
      name: string;
      department_id: string;
    };
    course: {
      id: string;
      name: string;
    };
  };
  teacher: {
    id: string;
    full_name: string;
  };
  course_book: {
    id: string;
    title: string;
  } | null;
};

export type DailyLessonLogFilters = {
  start_date?: string;
  end_date?: string;
  teacher_id?: string;
  class_course_id?: string;
  department_id?: string;
};

export async function getDailyLessonLogs(
  profile: ProfileRow,
  filters: DailyLessonLogFilters = {},
): Promise<DailyLessonLogWithRelations[]> {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("daily_lesson_logs")
    .select(`
      *,
      class_course:class_courses(
        id,
        class:classes(id, name, department_id),
        course:courses(id, name)
      ),
      teacher:profiles(id, full_name),
      course_book:course_books(id, title)
    `)
    .order("lesson_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters.start_date) {
    query = query.gte("lesson_date", filters.start_date);
  }

  if (filters.end_date) {
    query = query.lte("lesson_date", filters.end_date);
  }

  if (filters.teacher_id) {
    query = query.eq("teacher_id", filters.teacher_id);
  }

  if (filters.class_course_id) {
    query = query.eq("class_course_id", filters.class_course_id);
  }

  if (filters.department_id && ["bolum_muduru", "hoca"].includes(profile.role)) {
    query = query.eq("class_course.class.department_id", filters.department_id);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("Ders notları alınamadı.");
  }

  return (data ?? []) as DailyLessonLogWithRelations[];
}

export async function getMyDailyLessonLogs(
  teacherId: string,
  limit = 10,
): Promise<DailyLessonLogRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("daily_lesson_logs")
    .select("*")
    .eq("teacher_id", teacherId)
    .order("lesson_date", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error("Ders notlarınız alınamadı.");
  }

  return (data ?? []) as DailyLessonLogRow[];
}

export async function getDailyLessonLogById(logId: string) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("daily_lesson_logs")
    .select(`
      *,
      class_course:class_courses(
        id,
        class:classes(id, name, department_id),
        course:courses(id, name)
      ),
      teacher:profiles(id, full_name),
      course_book:course_books(id, title)
    `)
    .eq("id", logId)
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as DailyLessonLogWithRelations, error: null };
}

export async function getTodayLessonLog(teacherId: string, classCourseId: string) {
  const supabase = await createSupabaseServerClient();
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("daily_lesson_logs")
    .select("*")
    .eq("teacher_id", teacherId)
    .eq("class_course_id", classCourseId)
    .eq("lesson_date", today)
    .maybeSingle();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as DailyLessonLogRow | null, error: null };
}

export async function getDailyLessonLogStats(
  profile: ProfileRow,
  startDate: string,
  endDate: string,
) {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("daily_lesson_logs")
    .select(`
      id,
      teacher_id,
      lesson_date,
      class_course:class_courses(
        id,
        class:classes(id, name, department_id),
        course:courses(id, name)
      )
    `)
    .gte("lesson_date", startDate)
    .lte("lesson_date", endDate);

  if (profile.role === "bolum_muduru" && profile.department_id) {
    query = query.eq("class_course.class.department_id", profile.department_id);
  }

  if (profile.role === "hoca" && profile.id) {
    query = query.eq("teacher_id", profile.id);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("İstatistikler alınamadı.");
  }

  return data ?? [];
}

export async function getTeachersWithDailyLessonLogs(
  departmentId: string,
  startDate: string,
  endDate: string,
) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("daily_lesson_logs")
    .select(`
      teacher:profiles!daily_lesson_logs_teacher_id_fkey(id, full_name),
      lesson_date
    `)
    .gte("lesson_date", startDate)
    .lte("lesson_date", endDate)
    .eq("class_course.class.department_id", departmentId);

  if (error) {
    throw new Error("Öğretmen notları alınamadı.");
  }

  return data ?? [];
}

export async function getClassCoursesForTeacher(teacherId: string) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("class_courses")
    .select(`
      id,
      class:classes(id, name, department_id),
      course:courses(id, name)
    `)
    .eq("teacher_id", teacherId)
    .eq("is_active", true);

  if (error) {
    throw new Error("Ders programı alınamadı.");
  }

  return data ?? [];
}