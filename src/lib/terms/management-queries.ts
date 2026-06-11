import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AcademicTermRow, ProfileRow, TermClosureRunRow } from "@/types/database";

export type ManagedAcademicTerm = AcademicTermRow & {
  closedByProfile: Pick<ProfileRow, "id" | "full_name"> | null;
  snapshotCount: number;
  latestClosureRun: Pick<TermClosureRunRow, "id" | "status" | "started_at" | "completed_at" | "failed_at" | "error_message"> | null;
};

export type AcademicTermManagementSummary = {
  activeTermName: string | null;
  totalTermCount: number;
  closedTermCount: number;
  lastClosureDate: string | null;
};

export type AcademicTermManagementOverview = {
  terms: ManagedAcademicTerm[];
  summary: AcademicTermManagementSummary;
};

export type AcademicTermDetail = ManagedAcademicTerm & {
  studentCount: number;
  gradeCount: number;
  evaluationCount: number;
  attendanceSessionCount: number;
  attendanceRecordCount: number;
  infirmaryRecordCount: number;
};

export async function getAcademicTermManagementOverview(): Promise<AcademicTermManagementOverview> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.from("academic_terms").select("*").order("created_at", { ascending: false });

  if (error) {
    throw new Error("Dönem listesi alınamadı.");
  }

  const terms = (data ?? []) as AcademicTermRow[];
  const enrichedTerms = await enrichTerms(terms);
  const activeTerm = enrichedTerms.find((term) => term.status === "active" && term.is_active);
  const closedTerms = enrichedTerms.filter((term) => term.status === "closed");
  const lastClosedTerm = enrichedTerms
    .filter((term) => term.closed_at)
    .sort((left, right) => new Date(right.closed_at ?? "").getTime() - new Date(left.closed_at ?? "").getTime())[0];

  return {
    terms: enrichedTerms,
    summary: {
      activeTermName: activeTerm?.name ?? null,
      totalTermCount: enrichedTerms.length,
      closedTermCount: closedTerms.length,
      lastClosureDate: lastClosedTerm?.closed_at ?? null,
    },
  };
}

export async function getAcademicTermManagementDetail(id: string): Promise<AcademicTermDetail | null> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.from("academic_terms").select("*").eq("id", id).maybeSingle();

  if (error) {
    throw new Error("Dönem detayı alınamadı.");
  }

  if (!data) {
    return null;
  }

  const [term] = await enrichTerms([data as AcademicTermRow]);
  const [activeStudentCount, gradeCount, evaluationCount, attendanceSessionIds, infirmaryRecordCount] = await Promise.all([
    term.status === "closed" || term.status === "archived" ? Promise.resolve(term.snapshotCount) : countActiveStudents(),
    countRowsByTerm("grades", term.id),
    countRowsByTerm("student_evaluations", term.id),
    getAttendanceSessionIds(term.start_date, term.end_date),
    countInfirmaryRecords(term.start_date, term.end_date),
  ]);
  const attendanceRecordCount = await countAttendanceRecords(attendanceSessionIds);

  return {
    ...term,
    studentCount: activeStudentCount,
    gradeCount,
    evaluationCount,
    attendanceSessionCount: attendanceSessionIds.length,
    attendanceRecordCount,
    infirmaryRecordCount,
  };
}

async function enrichTerms(terms: AcademicTermRow[]): Promise<ManagedAcademicTerm[]> {
  if (terms.length === 0) {
    return [];
  }

  const admin = createSupabaseAdminClient();
  const termIds = terms.map((term) => term.id);
  const closedByProfileIds = Array.from(new Set(terms.map((term) => term.closed_by).filter(Boolean))) as string[];

  const [{ data: snapshots, error: snapshotError }, { data: runs, error: runError }, { data: profiles, error: profileError }] = await Promise.all([
    admin.from("student_term_snapshots").select("term_id").in("term_id", termIds),
    admin.from("term_closure_runs").select("id,term_id,status,started_at,completed_at,failed_at,error_message,created_at").in("term_id", termIds).order("created_at", { ascending: false }),
    closedByProfileIds.length > 0
      ? admin.from("profiles").select("id,full_name").in("id", closedByProfileIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (snapshotError) {
    throw new Error("Dönem snapshot sayıları alınamadı.");
  }

  if (runError) {
    throw new Error("Dönem kapanış durumları alınamadı.");
  }

  if (profileError) {
    throw new Error("Dönem kapatan kullanıcı bilgisi alınamadı.");
  }

  const snapshotCounts = new Map<string, number>();
  for (const snapshot of snapshots ?? []) {
    snapshotCounts.set(snapshot.term_id, (snapshotCounts.get(snapshot.term_id) ?? 0) + 1);
  }

  const latestRunMap = new Map<string, ManagedAcademicTerm["latestClosureRun"]>();
  for (const run of runs ?? []) {
    if (!latestRunMap.has(run.term_id)) {
      latestRunMap.set(run.term_id, run as ManagedAcademicTerm["latestClosureRun"]);
    }
  }

  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  return terms.map((term) => ({
    ...term,
    closedByProfile: term.closed_by ? profileMap.get(term.closed_by) ?? null : null,
    snapshotCount: snapshotCounts.get(term.id) ?? 0,
    latestClosureRun: latestRunMap.get(term.id) ?? null,
  }));
}

async function countActiveStudents() {
  const admin = createSupabaseAdminClient();
  const { count, error } = await admin.from("students").select("id", { count: "exact", head: true }).eq("status", "active");
  if (error) throw new Error("Öğrenci sayısı alınamadı.");
  return count ?? 0;
}

async function countRowsByTerm(table: "grades" | "student_evaluations", termId: string) {
  const admin = createSupabaseAdminClient();
  const { count, error } = await admin.from(table).select("id", { count: "exact", head: true }).eq("term_id", termId);
  if (error) throw new Error("Dönem kayıt sayısı alınamadı.");
  return count ?? 0;
}

async function getAttendanceSessionIds(startDate: string | null, endDate: string | null) {
  const admin = createSupabaseAdminClient();
  let query = admin.from("attendance_sessions").select("id");

  if (startDate) {
    query = query.gte("attendance_date", startDate);
  }

  if (endDate) {
    query = query.lte("attendance_date", endDate);
  }

  const { data, error } = await query;
  if (error) throw new Error("Yoklama oturumları alınamadı.");
  return (data ?? []).map((session) => session.id);
}

async function countAttendanceRecords(sessionIds: string[]) {
  if (sessionIds.length === 0) {
    return 0;
  }

  const admin = createSupabaseAdminClient();
  const { count, error } = await admin.from("attendance_records").select("id", { count: "exact", head: true }).in("session_id", sessionIds);
  if (error) throw new Error("Yoklama kayıt sayısı alınamadı.");
  return count ?? 0;
}

async function countInfirmaryRecords(startDate: string | null, endDate: string | null) {
  const admin = createSupabaseAdminClient();
  let query = admin.from("infirmary_records").select("id", { count: "exact", head: true });

  if (startDate) {
    query = query.gte("record_date", startDate);
  }

  if (endDate) {
    query = query.lte("record_date", endDate);
  }

  const { count, error } = await query;
  if (error) throw new Error("Revir kayıt sayısı alınamadı.");
  return count ?? 0;
}
