"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAuth } from "@/lib/auth";
import { canManageStudentProfileEntries } from "@/lib/student-profile/permissions";
import { getStudentById } from "@/lib/students/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAcademicTermWritable } from "@/lib/terms/guards";

const emptyToNull = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}, z.string().nullable());

const noteSchema = z.object({
  student_id: z.string().uuid(),
  term_id: emptyToNull,
  note: z.string().trim().min(3, "Yorum en az 3 karakter olmalıdır."),
});

const bookSchema = z.object({
  student_id: z.string().uuid(),
  term_id: emptyToNull,
  title: z.string().trim().min(2, "Kitap adı zorunludur."),
  author: emptyToNull,
  read_date: emptyToNull,
  note: emptyToNull,
});

export async function addStudentProfileNoteAction(formData: FormData) {
  const { profile } = await requireAuth();
  const parsed = noteSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirect(`/talebeler?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Form hatalı.")}`);
  }

  const student = await getStudentById(parsed.data.student_id);
  if (!student) redirect("/talebeler?error=not-found");
  if (!canManageStudentProfileEntries(profile, student.course_class)) {
    redirect(`/talebeler/${student.id}?error=unauthorized`);
  }

  if (parsed.data.term_id) {
    try {
      await requireAcademicTermWritable(parsed.data.term_id);
    } catch {
      redirect(`/talebeler/${student.id}?error=term-closed`);
    }
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("student_profile_notes").insert({
    student_id: student.id,
    term_id: parsed.data.term_id,
    note: parsed.data.note,
    created_by: profile.id,
    updated_by: profile.id,
  });

  if (error) {
    redirect(`/talebeler/${student.id}?error=profile-note-save`);
  }

  revalidateStudentProfile(student.id);
  redirect(`/talebeler/${student.id}?profileSaved=note`);
}

export async function addStudentBookAction(formData: FormData) {
  const { profile } = await requireAuth();
  const parsed = bookSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirect(`/talebeler?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Form hatalı.")}`);
  }

  const student = await getStudentById(parsed.data.student_id);
  if (!student) redirect("/talebeler?error=not-found");
  if (!canManageStudentProfileEntries(profile, student.course_class)) {
    redirect(`/talebeler/${student.id}?error=unauthorized`);
  }

  if (parsed.data.term_id) {
    try {
      await requireAcademicTermWritable(parsed.data.term_id);
    } catch {
      redirect(`/talebeler/${student.id}?error=term-closed`);
    }
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("student_books").insert({
    student_id: student.id,
    term_id: parsed.data.term_id,
    title: parsed.data.title,
    author: parsed.data.author,
    read_date: parsed.data.read_date,
    note: parsed.data.note,
    created_by: profile.id,
    updated_by: profile.id,
  });

  if (error) {
    redirect(`/talebeler/${student.id}?error=book-save`);
  }

  revalidateStudentProfile(student.id);
  redirect(`/talebeler/${student.id}?profileSaved=book`);
}

function revalidateStudentProfile(studentId: string) {
  revalidatePath(`/talebeler/${studentId}`);
  revalidatePath("/veli");
}
