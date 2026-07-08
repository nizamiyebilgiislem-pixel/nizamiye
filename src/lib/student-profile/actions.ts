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
  note: z.string().trim().min(3, "Yorum en az 3 karakter olmalidir."),
});

const updateNoteSchema = z.object({
  note_id: z.string().uuid(),
  student_id: z.string().uuid(),
  term_id: emptyToNull,
  note: z.string().trim().min(3, "Yorum en az 3 karakter olmalidir."),
});

const deleteNoteSchema = z.object({
  note_id: z.string().uuid(),
  student_id: z.string().uuid(),
});

const bookSchema = z.object({
  student_id: z.string().uuid(),
  term_id: emptyToNull,
  title: z.string().trim().min(2, "Kitap adi zorunludur."),
  author: emptyToNull,
  read_date: emptyToNull,
  note: emptyToNull,
});

export async function addStudentProfileNoteAction(formData: FormData) {
  const { profile } = await requireAuth();
  const parsed = noteSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirect(`/talebeler?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Form hatali.")}`);
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

export async function updateStudentProfileNoteAction(formData: FormData) {
  const { profile } = await requireAuth();
  const parsed = updateNoteSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirect(`/talebeler?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Form hatali.")}`);
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
  const { data: existing, error: fetchError } = await supabase
    .from("student_profile_notes")
    .select("*")
    .eq("id", parsed.data.note_id)
    .eq("student_id", student.id)
    .maybeSingle();

  if (fetchError || !existing) {
    redirect(`/talebeler/${student.id}?error=not-found`);
  }

  const { error } = await supabase
    .from("student_profile_notes")
    .update({
      term_id: parsed.data.term_id,
      note: parsed.data.note,
      updated_by: profile.id,
    })
    .eq("id", parsed.data.note_id)
    .eq("student_id", student.id);

  if (error) {
    redirect(`/talebeler/${student.id}?error=profile-note-update`);
  }

  revalidateStudentProfile(student.id);
  redirect(`/talebeler/${student.id}?profileSaved=note-updated`);
}

export async function deleteStudentProfileNoteAction(formData: FormData) {
  const { profile } = await requireAuth();
  const parsed = deleteNoteSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirect(`/talebeler?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Form hatali.")}`);
  }

  const student = await getStudentById(parsed.data.student_id);
  if (!student) redirect("/talebeler?error=not-found");
  if (!canManageStudentProfileEntries(profile, student.course_class)) {
    redirect(`/talebeler/${student.id}?error=unauthorized`);
  }

  const supabase = await createSupabaseServerClient();
  const { data: existing, error: fetchError } = await supabase
    .from("student_profile_notes")
    .select("*")
    .eq("id", parsed.data.note_id)
    .eq("student_id", student.id)
    .maybeSingle();

  if (fetchError || !existing) {
    redirect(`/talebeler/${student.id}?error=not-found`);
  }

  const { error } = await supabase
    .from("student_profile_notes")
    .delete()
    .eq("id", parsed.data.note_id)
    .eq("student_id", student.id);

  if (error) {
    redirect(`/talebeler/${student.id}?error=profile-note-delete`);
  }

  revalidateStudentProfile(student.id);
  redirect(`/talebeler/${student.id}?profileSaved=note-deleted`);
}

export async function addStudentBookAction(formData: FormData) {
  const { profile } = await requireAuth();
  const parsed = bookSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirect(`/talebeler?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Form hatali.")}`);
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
