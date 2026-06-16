import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CourseBookRow, CourseBookProgressRow, ClassRow } from "@/types/database";

export type CourseBookWithProgress = CourseBookRow & {
  progress: CourseBookProgressRow[];
};

export type CourseBookProgressWithRelations = CourseBookProgressRow & {
  course_book: CourseBookRow;
  class: ClassRow;
};

export type CourseBookProgressWithCourseBook = CourseBookProgressRow & {
  course_book: {
    id: string;
    title: string;
    book_order: number;
    course_id: string;
    course: {
      id: string;
      name: string;
    } | null;
  } | null;
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

  const result = classCourses as Array<{ class: ClassRow | null }> | null;
  return (result ?? []).map((cc) => cc.class).filter((c): c is ClassRow => c !== null);
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

export async function getStudentCourseBookProgress(studentId: string): Promise<StudentCourseBookProgress[]> {
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

  return (progress ?? []) as StudentCourseBookProgress[];
}

export type StudentCourseBookProgress = CourseBookProgressWithCourseBook;

export async function getCourseBooksForTeacher(teacherId: string) {
  const supabase = await createSupabaseServerClient();

  const { data: classCourses, error } = await supabase
    .from("class_courses")
    .select("course_id")
    .eq("teacher_id", teacherId)
    .eq("is_active", true);

  if (error) {
    throw new Error("Ders kitapları alınamadı.");
  }

  const courseIds = (classCourses ?? []).map((cc) => cc.course_id);
  if (courseIds.length === 0) {
    return [];
  }

  const { data: books, error: booksError } = await supabase
    .from("course_books")
    .select("id, title, course_id")
    .in("course_id", courseIds)
    .eq("is_active", true)
    .order("course_id")
    .order("book_order");

  if (booksError) {
    throw new Error("Ders kitapları alınamadı.");
  }

  return books ?? [];
}