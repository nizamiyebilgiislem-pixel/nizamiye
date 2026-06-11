import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AcademicTermRow, StudentTermSnapshotRow } from "@/types/database";

export async function getAcademicTerms() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("academic_terms").select("*").order("created_at", { ascending: false });

  if (error) {
    throw new Error("Dönemler alınamadı.");
  }

  return data;
}

export const getActiveTerms = cache(async () => {
  const terms = await getAcademicTerms();
  return terms.filter((term) => term.is_active);
});

export async function getCurrentAcademicTerm() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("academic_terms")
    .select("*")
    .eq("is_current", true)
    .maybeSingle();

  if (error) {
    throw new Error("Aktif dönem alınamadı.");
  }

  return data as AcademicTermRow | null;
}

export async function getAcademicTermById(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("academic_terms").select("*").eq("id", id).maybeSingle();

  if (error) {
    throw new Error("Dönem bilgisi alınamadı.");
  }

  return data as AcademicTermRow | null;
}

export async function getStudentTermSnapshots(studentId: string) {
  const supabase = await createSupabaseServerClient();
  const [{ data: snapshots, error }, { data: terms }, { data: departments }, { data: classes }] = await Promise.all([
    supabase.from("student_term_snapshots").select("*").eq("student_id", studentId).order("created_at", { ascending: false }),
    supabase.from("academic_terms").select("*"),
    supabase.from("departments").select("*"),
    supabase.from("classes").select("*"),
  ]);

  if (error) {
    throw new Error("Dönem geçmişi alınamadı.");
  }

  const termMap = new Map((terms ?? []).map((term) => [term.id, term]));
  const departmentMap = new Map((departments ?? []).map((department) => [department.id, department]));
  const classMap = new Map((classes ?? []).map((classRow) => [classRow.id, classRow]));

  return (snapshots ?? []).map((snapshot) => ({
    ...snapshot,
    term: termMap.get(snapshot.term_id) ?? null,
    department: snapshot.department_id ? departmentMap.get(snapshot.department_id) ?? null : null,
    classRow: snapshot.class_id ? classMap.get(snapshot.class_id) ?? null : null,
  }));
}

export type StudentTermSnapshotWithRelations = StudentTermSnapshotRow & {
  term: AcademicTermRow | null;
  department: { id: string; name: string } | null;
  classRow: { id: string; name: string } | null;
};
