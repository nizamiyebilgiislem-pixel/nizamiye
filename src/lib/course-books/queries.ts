import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CourseBookRow, CourseBookProgressRow, ClassRow } from "@/types/database";

export type CourseBookWithProgress = CourseBookRow & {
  progress: CourseBookProgressRow[];
};

export type CourseBookProgressWithRelations = CourseBookProgressRow & {
  course_book: CourseBookRow;
  class: ClassRow;
};

export async function getCourseBooks(courseId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("course_books")
    .select("*")
    .eq("course_id", courseId)
    .order("book_order", { ascending: true });

  if (error) {
    throw new Error("Ders kitapları alınamadı.");
  }

  return data ?? [];
}

export async function getCourseBooksWithProgress(courseId: string) {
  const supabase = await createSupabaseServerClient();

  const [booksResult, progressResult] = await Promise.all([
    supabase
      .from("course_books")
      .select("*")
      .eq("course_id", courseId)
      .order("book_order", { ascending: true }),
    supabase
      .from("course_book_progress")
      .select("*")
      .order("started_at", { ascending: true }),
  ]);

  if (booksResult.error) {
    throw new Error("Ders kitapları alınamadı.");
  }

  const books = booksResult.data ?? [];
  const progressMap = new Map<string, CourseBookProgressRow[]>();

  (progressResult.data ?? []).forEach((p) => {
    const existing = progressMap.get(p.course_book_id) || [];
    existing.push(p);
    progressMap.set(p.course_book_id, existing);
  });

  return books.map((book) => ({
    ...book,
    progress: progressMap.get(book.id) || [],
  })) satisfies CourseBookWithProgress[];
}

export async function getCourseBookProgress(courseBookId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("course_book_progress")
    .select("*")
    .eq("course_book_id", courseBookId)
    .order("class_id");

  if (error) {
    throw new Error("Kitap ilerlemesi alınamadı.");
  }

  return data ?? [];
}

export async function getClassesForCourse(courseId: string) {
  const supabase = await createSupabaseServerClient();

  const { data: classCourses, error } = await supabase
    .from("class_courses")
    .select("class:classes(id, name, department_id)")
    .eq("course_id", courseId)
    .eq("is_active", true);

  if (error) {
    throw new Error("Sınıflar alınamadı.");
  }

  return (classCourses ?? []).map((cc) => cc.class).filter(Boolean) as ClassRow[];
}

export async function getClassesForCourseBook(courseBookId: string) {
  const supabase = await createSupabaseServerClient();

  const { data: book } = await supabase
    .from("course_books")
    .select("course_id")
    .eq("id", courseBookId)
    .single();

  if (!book) {
    return [];
  }

  const { data: classCourses, error } = await supabase
    .from("class_courses")
    .select("class_id, class:classes(id, name)")
    .eq("course_id", book.course_id)
    .eq("is_active", true);

  if (error) {
    throw new Error("Sınıflar alınamadı.");
  }

  return classCourses ?? [];
}

export async function getCourseBookProgressForClass(courseBookId: string, classId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("course_book_progress")
    .select("*")
    .eq("course_book_id", courseBookId)
    .eq("class_id", classId)
    .maybeSingle();

  if (error) {
    throw new Error("İlerleme bilgisi alınamadı.");
  }

  return data;
}

export async function getStudentCourseBookProgress(studentId: string) {
  const supabase = await createSupabaseServerClient();

  const { data: student } = await supabase
    .from("students")
    .select("course_class_id")
    .eq("id", studentId)
    .single();

  if (!student?.course_class_id) {
    return [];
  }

  const { data: progress, error } = await supabase
    .from("course_book_progress")
    .select(`
      *,
      course_book:course_books(id, title, book_order, course_id, course:courses(id, name))
    `)
    .eq("class_id", student.course_class_id)
    .order("course_book(book_order)", { ascending: true });

  if (error) {
    throw new Error("Öğrenci kitap ilerlemesi alınamadı.");
  }

  return progress ?? [];
}

export type StudentCourseBookProgress = Awaited<ReturnType<typeof getStudentCourseBookProgress>>[number];