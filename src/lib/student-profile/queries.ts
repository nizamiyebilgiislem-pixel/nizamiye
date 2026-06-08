import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AcademicTermRow, ProfileRow, StudentBookRow, StudentProfileNoteRow } from "@/types/database";

export type StudentProfileNoteWithRelations = StudentProfileNoteRow & {
  term: AcademicTermRow | null;
  creator: ProfileRow | null;
};

export type StudentBookWithRelations = StudentBookRow & {
  term: AcademicTermRow | null;
  creator: ProfileRow | null;
};

export async function getStudentProfileEntries(studentId: string) {
  const supabase = await createSupabaseServerClient();
  const [notesResult, booksResult, termsResult, profilesResult] = await Promise.all([
    supabase.from("student_profile_notes").select("*").eq("student_id", studentId).order("created_at", { ascending: false }),
    supabase.from("student_books").select("*").eq("student_id", studentId).order("read_date", { ascending: false, nullsFirst: false }),
    supabase.from("academic_terms").select("*"),
    supabase.from("profiles").select("*"),
  ]);

  if (notesResult.error) {
    throw new Error("Öğrenci profil yorumları alınamadı.");
  }

  if (booksResult.error) {
    throw new Error("Öğrenci kitap kayıtları alınamadı.");
  }

  const termMap = new Map((termsResult.data ?? []).map((term) => [term.id, term]));
  const profileMap = new Map((profilesResult.data ?? []).map((profile) => [profile.id, profile]));

  return {
    notes: (notesResult.data ?? []).map((note) => ({
      ...note,
      term: note.term_id ? termMap.get(note.term_id) ?? null : null,
      creator: note.created_by ? profileMap.get(note.created_by) ?? null : null,
    })) satisfies StudentProfileNoteWithRelations[],
    books: (booksResult.data ?? []).map((book) => ({
      ...book,
      term: book.term_id ? termMap.get(book.term_id) ?? null : null,
      creator: book.created_by ? profileMap.get(book.created_by) ?? null : null,
    })) satisfies StudentBookWithRelations[],
  };
}

export async function getLinkedStudentIdsForParent(profileId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("parent_student_links").select("student_id").eq("parent_profile_id", profileId);

  if (error) {
    throw new Error("Veli-talebe bağlantısı alınamadı.");
  }

  return (data ?? []).map((link) => link.student_id);
}
