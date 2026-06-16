"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAuth } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { canManageCourseBooks, canManageCourseBookProgress } from "@/lib/course-books/permissions";

const createCourseBookSchema = z.object({
  course_id: z.string().uuid("Ders seçilmelidir."),
  title: z.string().trim().min(2, "Kitap başlığı en az 2 karakter olmalıdır."),
  author: z.string().nullable(),
  book_order: z.coerce.number().int().min(0).default(0),
});

const updateCourseBookSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(2, "Kitap başlığı en az 2 karakter olmalıdır."),
  author: z.string().nullable(),
  book_order: z.coerce.number().int().min(0),
  is_active: z.boolean(),
});

const updateProgressSchema = z.object({
  course_book_id: z.string().uuid(),
  class_id: z.string().uuid(),
  started_at: z.string().nullable(),
  completed_at: z.string().nullable(),
  status: z.enum(["not_started", "ongoing", "completed"]),
});

export async function createCourseBookAction(formData: FormData) {
  const { profile } = await requireAuth();

  const rawData = {
    course_id: formData.get("course_id"),
    title: formData.get("title"),
    author: formData.get("author") || null,
    book_order: formData.get("book_order") || "0",
  };

  const parsed = createCourseBookSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const supabase = await createSupabaseServerClient();

  const { data: course } = await supabase
    .from("courses")
    .select("department_id")
    .eq("id", parsed.data.course_id)
    .single();

  if (!canManageCourseBooks(profile, course?.department_id)) {
    return { error: "Bu işlem için yetkiniz yok." };
  }

  const { error } = await supabase.from("course_books").insert({
    course_id: parsed.data.course_id,
    title: parsed.data.title,
    author: parsed.data.author,
    book_order: parsed.data.book_order,
    is_active: true,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/ders-sistemi");
  redirect(`/ders-sistemi/${parsed.data.course_id}/kitaplar?success=book-created`);
}

export async function updateCourseBookAction(formData: FormData) {
  const { profile } = await requireAuth();

  const rawData = {
    id: formData.get("id"),
    title: formData.get("title"),
    author: formData.get("author") || null,
    book_order: formData.get("book_order") || "0",
    is_active: formData.get("is_active") === "true",
  };

  const parsed = updateCourseBookSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const supabase = await createSupabaseServerClient();

  const { data: book } = await supabase
    .from("course_books")
    .select("course_id")
    .eq("id", parsed.data.id)
    .single();

  if (!book) {
    return { error: "Kitap bulunamadı." };
  }

  const { data: course } = await supabase
    .from("courses")
    .select("department_id")
    .eq("id", book.course_id)
    .single();

  if (!canManageCourseBooks(profile, course?.department_id)) {
    return { error: "Bu işlem için yetkiniz yok." };
  }

  const { error } = await supabase
    .from("course_books")
    .update({
      title: parsed.data.title,
      author: parsed.data.author,
      book_order: parsed.data.book_order,
      is_active: parsed.data.is_active,
    })
    .eq("id", parsed.data.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/ders-sistemi");
  redirect(`/ders-sistemi/${book.course_id}/kitaplar?success=book-updated`);
}

export async function deleteCourseBookAction(bookId: string) {
  const { profile } = await requireAuth();

  const supabase = await createSupabaseServerClient();

  const { data: book } = await supabase
    .from("course_books")
    .select("course_id")
    .eq("id", bookId)
    .single();

  if (!book) {
    return { error: "Kitap bulunamadı." };
  }

  const { data: course } = await supabase
    .from("courses")
    .select("department_id")
    .eq("id", book.course_id)
    .single();

  if (!canManageCourseBooks(profile, course?.department_id)) {
    return { error: "Bu işlem için yetkiniz yok." };
  }

  const { error } = await supabase
    .from("course_books")
    .delete()
    .eq("id", bookId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/ders-sistemi");
  redirect(`/ders-sistemi/${book.course_id}/kitaplar?success=book-deleted`);
}

export async function updateCourseBookProgressAction(formData: FormData) {
  const { profile } = await requireAuth();

  const rawData = {
    course_book_id: formData.get("course_book_id"),
    class_id: formData.get("class_id"),
    started_at: formData.get("started_at") || null,
    completed_at: formData.get("completed_at") || null,
    status: formData.get("status"),
  };

  const parsed = updateProgressSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const supabase = await createSupabaseServerClient();

  const { data: classInfo } = await supabase
    .from("classes")
    .select("department_id")
    .eq("id", parsed.data.class_id)
    .single();

  if (!canManageCourseBookProgress(profile, classInfo?.department_id)) {
    return { error: "Bu işlem için yetkiniz yok." };
  }

  const { data: existing } = await supabase
    .from("course_book_progress")
    .select("id")
    .eq("course_book_id", parsed.data.course_book_id)
    .eq("class_id", parsed.data.class_id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("course_book_progress")
      .update({
        started_at: parsed.data.started_at,
        completed_at: parsed.data.completed_at,
        status: parsed.data.status,
      })
      .eq("id", existing.id);

    if (error) {
      return { error: error.message };
    }
  } else {
    const { error } = await supabase.from("course_book_progress").insert({
      course_book_id: parsed.data.course_book_id,
      class_id: parsed.data.class_id,
      started_at: parsed.data.started_at,
      completed_at: parsed.data.completed_at,
      status: parsed.data.status,
    });

    if (error) {
      return { error: error.message };
    }
  }

  revalidatePath("/ders-sistemi");
  revalidatePath(`/ders-sistemi/${parsed.data.course_book_id}`);
  return { success: true };
}

export async function startCourseBookAction(courseBookId: string, classId: string) {
  const { profile } = await requireAuth();

  const supabase = await createSupabaseServerClient();

  const { data: classInfo } = await supabase
    .from("classes")
    .select("department_id")
    .eq("id", classId)
    .single();

  if (!canManageCourseBookProgress(profile, classInfo?.department_id)) {
    return { error: "Bu işlem için yetkiniz yok." };
  }

  const today = new Date().toISOString().split("T")[0];

  const { data: existing } = await supabase
    .from("course_book_progress")
    .select("id")
    .eq("course_book_id", courseBookId)
    .eq("class_id", classId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("course_book_progress")
      .update({
        started_at: today,
        status: "ongoing",
      })
      .eq("id", existing.id);

    if (error) {
      return { error: error.message };
    }
  } else {
    const { error } = await supabase.from("course_book_progress").insert({
      course_book_id: courseBookId,
      class_id: classId,
      started_at: today,
      status: "ongoing",
    });

    if (error) {
      return { error: error.message };
    }
  }

  revalidatePath("/ders-sistemi");
  return { success: true };
}

export async function completeCourseBookAction(courseBookId: string, classId: string) {
  const { profile } = await requireAuth();

  const supabase = await createSupabaseServerClient();

  const { data: classInfo } = await supabase
    .from("classes")
    .select("department_id")
    .eq("id", classId)
    .single();

  if (!canManageCourseBookProgress(profile, classInfo?.department_id)) {
    return { error: "Bu işlem için yetkiniz yok." };
  }

  const today = new Date().toISOString().split("T")[0];

  const { data: existing } = await supabase
    .from("course_book_progress")
    .select("id")
    .eq("course_book_id", courseBookId)
    .eq("class_id", classId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("course_book_progress")
      .update({
        completed_at: today,
        status: "completed",
      })
      .eq("id", existing.id);

    if (error) {
      return { error: error.message };
    }
  } else {
    const { error } = await supabase.from("course_book_progress").insert({
      course_book_id: courseBookId,
      class_id: classId,
      completed_at: today,
      status: "completed",
    });

    if (error) {
      return { error: error.message };
    }
  }

  revalidatePath("/ders-sistemi");
  return { success: true };
}