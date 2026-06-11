import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { assertCanManageTermClosure } from "@/lib/terms/closure-permissions";
import type { AcademicTermRow, ProfileRow, TermSimulationResult } from "@/types/database";

export async function simulateTermClosure(term: AcademicTermRow, profile: ProfileRow): Promise<TermSimulationResult> {
  assertCanManageTermClosure(profile);

  const startDate = term.start_date;
  const endDate = term.end_date ?? new Date().toISOString().slice(0, 10);
  const timestampStart = startDate ? `${startDate}T00:00:00` : null;
  const timestampEnd = `${endDate}T23:59:59`;

  const [
    activeStudentCount,
    departmentCount,
    classCount,
    gradeCount,
    evaluationCount,
    attendanceSessionIds,
    infirmaryRecordCount,
    guidanceInterviewCount,
    guidanceFollowUpCount,
    guidanceSurveyCount,
    guidanceActivityCount,
    activeDormitoryAssignmentCount,
    openTaskCount,
    openTalepCount,
    openLibraryLoanCount,
    plannedLiveSessionCount,
  ] = await Promise.all([
    countActiveStudents(),
    countActiveDepartments(),
    countActiveClasses(),
    countGrades(term.id),
    countEvaluations(term.id),
    getAttendanceSessionIds(startDate, endDate),
    countInfirmaryRecords(startDate, endDate),
    countGuidanceInterviews(startDate, endDate),
    countGuidanceFollowUps(startDate, endDate),
    countGuidanceSurveys(startDate, endDate),
    countGuidanceActivities(startDate, endDate),
    countActiveDormitoryAssignments(),
    countOpenTasks(),
    countOpenTalepler(),
    countOpenLibraryLoans(),
    countPlannedLiveSessions(timestampStart, timestampEnd),
  ]);

  const attendanceRecordCount = await countAttendanceRecords(attendanceSessionIds);
  const warnings = buildSimulationWarnings({
    term,
    gradeCount,
    evaluationCount,
    attendanceSessionCount: attendanceSessionIds.length,
    activeDormitoryAssignmentCount,
    openTaskCount,
    openTalepCount,
    openLibraryLoanCount,
    plannedLiveSessionCount,
  });
  const blockers = buildSimulationBlockers(term);

  return {
    termId: term.id,
    termName: term.name,
    generatedAt: new Date().toISOString(),
    dateRange: {
      startDate,
      endDate,
    },
    activeStudentCount,
    departmentCount,
    classCount,
    gradeCount,
    evaluationCount,
    attendanceSessionCount: attendanceSessionIds.length,
    attendanceRecordCount,
    infirmaryRecordCount,
    guidanceRecordCount: guidanceInterviewCount + guidanceFollowUpCount + guidanceSurveyCount + guidanceActivityCount,
    activeDormitoryAssignmentCount,
    openTaskCount,
    openTalepCount,
    openLibraryLoanCount,
    plannedLiveSessionCount,
    warnings,
    blockers,
  };
}

async function countActiveStudents() {
  const admin = createSupabaseAdminClient();
  const { count, error } = await admin.from("students").select("id", { count: "exact", head: true }).eq("status", "active");
  assertNoSupabaseError(error, "Aktif öğrenci sayısı alınamadı.");
  return count ?? 0;
}

async function countActiveDepartments() {
  const admin = createSupabaseAdminClient();
  const { count, error } = await admin.from("departments").select("id", { count: "exact", head: true }).eq("is_active", true);
  assertNoSupabaseError(error, "Bölüm sayısı alınamadı.");
  return count ?? 0;
}

async function countActiveClasses() {
  const admin = createSupabaseAdminClient();
  const { count, error } = await admin.from("classes").select("id", { count: "exact", head: true }).eq("is_active", true);
  assertNoSupabaseError(error, "Sınıf sayısı alınamadı.");
  return count ?? 0;
}

async function countGrades(termId: string) {
  const admin = createSupabaseAdminClient();
  const { count, error } = await admin.from("grades").select("id", { count: "exact", head: true }).eq("term_id", termId);
  assertNoSupabaseError(error, "Not sayısı alınamadı.");
  return count ?? 0;
}

async function countEvaluations(termId: string) {
  const admin = createSupabaseAdminClient();
  const { count, error } = await admin.from("student_evaluations").select("id", { count: "exact", head: true }).eq("term_id", termId);
  assertNoSupabaseError(error, "Kanaat sayısı alınamadı.");
  return count ?? 0;
}

async function getAttendanceSessionIds(startDate: string | null, endDate: string) {
  const admin = createSupabaseAdminClient();
  let query = admin.from("attendance_sessions").select("id").lte("attendance_date", endDate);
  if (startDate) {
    query = query.gte("attendance_date", startDate);
  }

  const { data, error } = await query;
  assertNoSupabaseError(error, "Yoklama oturumları alınamadı.");
  return (data ?? []).map((session) => session.id);
}

async function countAttendanceRecords(sessionIds: string[]) {
  if (sessionIds.length === 0) return 0;

  const admin = createSupabaseAdminClient();
  const { count, error } = await admin
    .from("attendance_records")
    .select("id", { count: "exact", head: true })
    .in("session_id", sessionIds);
  assertNoSupabaseError(error, "Yoklama kayıt sayısı alınamadı.");
  return count ?? 0;
}

async function countInfirmaryRecords(startDate: string | null, endDate: string) {
  const admin = createSupabaseAdminClient();
  let query = admin.from("infirmary_records").select("id", { count: "exact", head: true }).lte("record_date", endDate);
  if (startDate) {
    query = query.gte("record_date", startDate);
  }

  const { count, error } = await query;
  assertNoSupabaseError(error, "Revir kayıt sayısı alınamadı.");
  return count ?? 0;
}

async function countGuidanceInterviews(startDate: string | null, endDate: string) {
  const admin = createSupabaseAdminClient();
  let query = admin.from("guidance_interviews").select("id", { count: "exact", head: true }).lte("interview_date", endDate);
  if (startDate) query = query.gte("interview_date", startDate);
  const { count, error } = await query;
  assertNoSupabaseError(error, "Rehberlik görüşme sayısı alınamadı.");
  return count ?? 0;
}

async function countGuidanceFollowUps(startDate: string | null, endDate: string) {
  const admin = createSupabaseAdminClient();
  let query = admin.from("guidance_follow_ups").select("id", { count: "exact", head: true }).lte("follow_up_date", endDate);
  if (startDate) query = query.gte("follow_up_date", startDate);
  const { count, error } = await query;
  assertNoSupabaseError(error, "Rehberlik takip sayısı alınamadı.");
  return count ?? 0;
}

async function countGuidanceSurveys(startDate: string | null, endDate: string) {
  const admin = createSupabaseAdminClient();
  let query = admin.from("guidance_surveys").select("id", { count: "exact", head: true }).lte("created_at", `${endDate}T23:59:59`);
  if (startDate) query = query.gte("created_at", `${startDate}T00:00:00`);
  const { count, error } = await query;
  assertNoSupabaseError(error, "Rehberlik anket sayısı alınamadı.");
  return count ?? 0;
}

async function countGuidanceActivities(startDate: string | null, endDate: string) {
  const admin = createSupabaseAdminClient();
  let query = admin.from("guidance_activities").select("id", { count: "exact", head: true }).lte("activity_date", endDate);
  if (startDate) query = query.gte("activity_date", startDate);
  const { count, error } = await query;
  assertNoSupabaseError(error, "Rehberlik etkinlik sayısı alınamadı.");
  return count ?? 0;
}

async function countActiveDormitoryAssignments() {
  const admin = createSupabaseAdminClient();
  const { count, error } = await admin.from("dormitory_assignments").select("id", { count: "exact", head: true }).eq("status", "active");
  assertNoSupabaseError(error, "Aktif yatakhane ataması sayısı alınamadı.");
  return count ?? 0;
}

async function countOpenTasks() {
  const admin = createSupabaseAdminClient();
  const { count, error } = await admin
    .from("tasks")
    .select("id", { count: "exact", head: true })
    .in("status", ["pending", "in_progress"])
    .eq("is_active", true);
  assertNoSupabaseError(error, "Açık görev sayısı alınamadı.");
  return count ?? 0;
}

async function countOpenTalepler() {
  const admin = createSupabaseAdminClient();
  const { count, error } = await admin
    .from("talepler")
    .select("id", { count: "exact", head: true })
    .in("status", ["bekliyor", "incelemede", "isleme_alindi", "onaylandi"]);
  assertNoSupabaseError(error, "Açık talep sayısı alınamadı.");
  return count ?? 0;
}

async function countOpenLibraryLoans() {
  const admin = createSupabaseAdminClient();
  const { count, error } = await admin.from("library_loans").select("id", { count: "exact", head: true }).eq("status", "borrowed");
  assertNoSupabaseError(error, "Açık kütüphane emaneti sayısı alınamadı.");
  return count ?? 0;
}

async function countPlannedLiveSessions(timestampStart: string | null, timestampEnd: string) {
  const admin = createSupabaseAdminClient();
  let query = admin
    .from("live_sessions")
    .select("id", { count: "exact", head: true })
    .in("status", ["planned", "active"])
    .lte("start_time", timestampEnd);

  if (timestampStart) {
    query = query.gte("start_time", timestampStart);
  }

  const { count, error } = await query;
  assertNoSupabaseError(error, "Planlı canlı oturum sayısı alınamadı.");
  return count ?? 0;
}

function buildSimulationWarnings(input: {
  term: AcademicTermRow;
  gradeCount: number;
  evaluationCount: number;
  attendanceSessionCount: number;
  activeDormitoryAssignmentCount: number;
  openTaskCount: number;
  openTalepCount: number;
  openLibraryLoanCount: number;
  plannedLiveSessionCount: number;
}) {
  const warnings: string[] = [];

  if (!input.term.start_date || !input.term.end_date) {
    warnings.push("Dönem başlangıç veya bitiş tarihi eksik. Tarih bazlı modüllerde arşiv kapsamı riskli olabilir.");
  }
  if (input.gradeCount === 0) warnings.push("Bu dönem için not kaydı bulunamadı.");
  if (input.evaluationCount === 0) warnings.push("Bu dönem için kanaat kaydı bulunamadı.");
  if (input.attendanceSessionCount === 0) warnings.push("Dönem tarih aralığında yoklama oturumu bulunamadı.");
  if (input.activeDormitoryAssignmentCount > 0) warnings.push("Aktif yatakhane atamaları yeni dönem için devretme veya sonlandırma kararı gerektirir.");
  if (input.openTaskCount > 0) warnings.push("Açık görevler yeni dönem için devretme veya kapatma kararı gerektirir.");
  if (input.openTalepCount > 0) warnings.push("Açık talepler yeni dönem için devretme veya kapatma kararı gerektirir.");
  if (input.openLibraryLoanCount > 0) warnings.push("Açık kütüphane emanetleri yeni döneme devredilecektir.");
  if (input.plannedLiveSessionCount > 0) warnings.push("Planlı veya aktif canlı oturumlar yeni dönem için kontrol edilmelidir.");

  return warnings;
}

function buildSimulationBlockers(term: AcademicTermRow) {
  const blockers: string[] = [];

  if (term.status === "closed" || term.status === "archived") {
    blockers.push("Bu dönem zaten kapalı veya arşivlenmiş durumda.");
  }

  return blockers;
}

function assertNoSupabaseError(error: { message?: string } | null, fallbackMessage: string) {
  if (error) {
    throw new Error(error.message ?? fallbackMessage);
  }
}
