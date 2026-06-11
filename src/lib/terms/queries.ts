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
  const { data: snapshots, error } = await supabase.from("student_term_snapshots").select("*").eq("student_id", studentId).order("created_at", { ascending: false });

  if (error) {
    throw new Error("Dönem geçmişi alınamadı.");
  }

  if (!snapshots || snapshots.length === 0) {
    return [] as StudentTermSnapshotWithRelations[];
  }

  const termIds = uniqueValues(snapshots.map((snapshot) => snapshot.term_id));
  const departmentIds = uniqueValues(snapshots.map((snapshot) => snapshot.department_id));
  const classIds = uniqueValues(snapshots.map((snapshot) => snapshot.class_id));

  const [{ data: terms, error: termsError }, { data: departments, error: departmentsError }, { data: classes, error: classesError }] = await Promise.all([
    supabase.from("academic_terms").select("*").in("id", termIds),
    departmentIds.length > 0 ? supabase.from("departments").select("id,name").in("id", departmentIds) : Promise.resolve({ data: [], error: null }),
    classIds.length > 0 ? supabase.from("classes").select("id,name").in("id", classIds) : Promise.resolve({ data: [], error: null }),
  ]);

  if (termsError || departmentsError || classesError) {
    throw new Error("Dönem geçmişi ilişki verileri alınamadı.");
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

function uniqueValues(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

export type StudentTermSnapshotWithRelations = StudentTermSnapshotRow & {
  term: AcademicTermRow | null;
  department: { id: string; name: string } | null;
  classRow: { id: string; name: string } | null;
};
