"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAuth } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { canCreateDailyLessonLog, canManageOwnDailyLessonLog } from "@/lib/daily-lesson-logs/permissions";

const createDailyLessonLogSchema = z.object({
  class_course_id: z.string().uuid("Ders seçilmelidir."),
  lesson_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Geçerli bir tarih seçilmelidir."),
  course_book_id: z.string().uuid().nullable().optional(),
  started_page: z.coerce.number().int().min(0).nullable().optional(),
  ended_page: z.coerce.number().int().min(0).nullable().optional(),
  topics_covered: z.string().trim().min(3, "İşlenen konular en az 3 karakter olmalıdır."),
  notes: z.string().nullable().optional(),
});

const updateDailyLessonLogSchema = z.object({
  id: z.string().uuid(),
  course_book_id: z.string().uuid().nullable().optional(),
  started_page: z.coerce.number().int().min(0).nullable().optional(),
  ended_page: z.coerce.number().int().min(0).nullable().optional(),
  topics_covered: z.string().trim().min(3, "İşlenen konular en az 3 karakter olmalıdır."),
  notes: z.string().nullable().optional(),
});

export async function createDailyLessonLogAction(formData: FormData) {
  const { profile } = await requireAuth();

  if (!canCreateDailyLessonLog(profile)) {
    throw new Error("Bu işlem için yetkiniz yok.");
  }

  const rawData = {
    class_course_id: formData.get("class_course_id"),
    lesson_date: formData.get("lesson_date"),
    course_book_id: formData.get("course_book_id") || null,
    started_page: formData.get("started_page") || null,
    ended_page: formData.get("ended_page") || null,
    topics_covered: formData.get("topics_covered"),
    notes: formData.get("notes") || null,
  };

  const parsed = createDailyLessonLogSchema.safeParse(rawData);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message);
  }

  const supabase = await createSupabaseServerClient();

  const { data: existing } = await supabase
    .from("daily_lesson_logs")
    .select("id")
    .eq("class_course_id", parsed.data.class_course_id)
    .eq("teacher_id", profile.id)
    .eq("lesson_date", parsed.data.lesson_date)
    .maybeSingle();

  if (existing) {
    throw new Error("Bu tarih için zaten ders notu girdiniz. Güncellemek için mevcut notu düzenleyin.");
  }

  const { error } = await supabase.from("daily_lesson_logs").insert({
    class_course_id: parsed.data.class_course_id,
    teacher_id: profile.id,
    lesson_date: parsed.data.lesson_date,
    course_book_id: parsed.data.course_book_id,
    started_page: parsed.data.started_page,
    ended_page: parsed.data.ended_page,
    topics_covered: parsed.data.topics_covered,
    notes: parsed.data.notes,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/ders-notlari");
  revalidatePath("/ogretmen");
  redirect("/ders-notlari?success=created");
}

export async function updateDailyLessonLogAction(formData: FormData) {
  const { profile } = await requireAuth();

  const rawData = {
    id: formData.get("id"),
    course_book_id: formData.get("course_book_id") || null,
    started_page: formData.get("started_page") || null,
    ended_page: formData.get("ended_page") || null,
    topics_covered: formData.get("topics_covered"),
    notes: formData.get("notes") || null,
  };

  const parsed = updateDailyLessonLogSchema.safeParse(rawData);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message);
  }

  const supabase = await createSupabaseServerClient();

  const { data: existing } = await supabase
    .from("daily_lesson_logs")
    .select("teacher_id")
    .eq("id", parsed.data.id)
    .single();

  if (!existing) {
    throw new Error("Ders notu bulunamadı.");
  }

  if (!canManageOwnDailyLessonLog(profile, existing.teacher_id)) {
    throw new Error("Bu notu düzenleme yetkiniz yok.");
  }

  const { error } = await supabase
    .from("daily_lesson_logs")
    .update({
      course_book_id: parsed.data.course_book_id,
      started_page: parsed.data.started_page,
      ended_page: parsed.data.ended_page,
      topics_covered: parsed.data.topics_covered,
      notes: parsed.data.notes,
    })
    .eq("id", parsed.data.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/ders-notlari");
  revalidatePath("/ogretmen");
  redirect("/ders-notlari?success=updated");
}

export async function deleteDailyLessonLogAction(logId: string) {
  const { profile } = await requireAuth();

  const supabase = await createSupabaseServerClient();

  const { data: existing } = await supabase
    .from("daily_lesson_logs")
    .select("teacher_id")
    .eq("id", logId)
    .single();

  if (!existing) {
    throw new Error("Ders notu bulunamadı.");
  }

  if (!canManageOwnDailyLessonLog(profile, existing.teacher_id)) {
    throw new Error("Bu notu silme yetkiniz yok.");
  }

  const { error } = await supabase
    .from("daily_lesson_logs")
    .delete()
    .eq("id", logId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/ders-notlari");
  revalidatePath("/ogretmen");
  redirect("/ders-notlari?success=deleted");
}