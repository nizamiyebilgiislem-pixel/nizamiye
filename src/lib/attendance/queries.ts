import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { canViewStudent } from "@/lib/students/permissions";
import type {
  AttendanceRecordRow,
  AttendanceRecordStatus,
  AttendanceSessionRow,
  AttendanceType,
  ClassRow,
  DepartmentRow,
  ProfileRow,
  StudentRow,
} from "@/types/database";
import type { StudentWithRelations } from "@/lib/students/queries";

import { attendanceTypeLabels, attendanceTypes, prayerAttendanceTypes } from "@/lib/attendance/constants";
import { canViewAttendanceClass } from "@/lib/attendance/permissions";

export type AttendanceSessionListFilters = {
  from?: string;
  to?: string;
  attendanceType?: AttendanceType | "all";
  departmentId?: string;
  classId?: string;
  status?: "all" | "completed" | "draft";
  search?: string;
};

export type AttendanceSessionWithRelations = AttendanceSessionRow & {
  course_class: ClassRow | null;
  department: DepartmentRow | null;
  taken_by_profile: ProfileRow | null;
  record_count: number;
  active_student_count: number;
  present_count: number;
  absent_count: number;
  excused_count: number;
  late_count: number;
  completion_status: "completed" | "draft";
};

export type AttendanceSessionDetail = {
  session: AttendanceSessionWithRelations;
  records: AttendanceRecordWithRelations[];
};

export type AttendanceRecordWithRelations = AttendanceRecordRow & {
  student: StudentRow | null;
};

export type AttendanceDashboardTypeSummary = {
  type: AttendanceType;
  label: string;
  takenClassCount: number;
  missingClassCount: number;
  presentCount: number;
  absentCount: number;
  excusedCount: number;
  lateCount: number;
};

export type AttendanceDashboardSummary = {
  visibleClassCount: number;
  daily: AttendanceDashboardTypeSummary;
  prayers: AttendanceDashboardTypeSummary[];
  mostMissingPrayer: AttendanceDashboardTypeSummary | null;
};

export type AttendanceStudentHistoryEntry = {
  id: string;
  status: AttendanceRecordStatus;
  note: string | null;
  session: AttendanceSessionWithRelations;
};

export type AttendanceStudentSummary = {
  student: StudentWithRelations | null;
  daily: {
    takenCount: number;
    presentCount: number;
    absentCount: number;
    excusedCount: number;
    lateCount: number;
  };
  prayers: Array<AttendanceDashboardTypeSummary>;
  entries: AttendanceStudentHistoryEntry[];
};

export type AttendanceReportSummary = {
  totalSessions: number;
  dailySessionCount: number;
  prayerSessionCount: number;
  completedSessionCount: number;
  draftSessionCount: number;
  totalRecords: number;
  dailyRecords: {
    presentCount: number;
    absentCount: number;
    excusedCount: number;
    lateCount: number;
  };
  prayerRecords: {
    presentCount: number;
    absentCount: number;
    excusedCount: number;
    lateCount: number;
  };
};

export type AttendanceReportRow = AttendanceSessionWithRelations & {
  filterLabel: string;
};

export async function getAttendanceFilterOptions(profile: ProfileRow) {
  const classes = await getVisibleClasses(profile);
  const departments = await getDepartmentsByClassIds(classes.map((classRow) => classRow.id));
  return { classes, departments };
}

export async function getAttendanceDashboardSummary(profile: ProfileRow): Promise<AttendanceDashboardSummary> {
  const today = getIstanbulDateString(new Date());
  const visibleClasses = await getVisibleClasses(profile);
  const visibleActiveClassCount = visibleClasses.filter((classRow) => classRow.is_active).length;
  const sessions = await getSessionsByDateRange(profile, { from: today, to: today });

  const summaries = attendanceTypes.map((type) => buildEmptyDashboardSummary(type));

  for (const summary of summaries) {
    const typeSessions = sessions.filter((session) => session.attendance_type === summary.type);
    summary.takenClassCount = typeSessions.length;
    summary.missingClassCount = Math.max(visibleActiveClassCount - typeSessions.length, 0);

    for (const session of typeSessions) {
      summary.presentCount += session.present_count;
      summary.absentCount += session.absent_count;
      summary.excusedCount += session.excused_count;
      summary.lateCount += session.late_count;
    }
  }

  const daily = summaries.find((item) => item.type === "daily") ?? buildEmptyDashboardSummary("daily");
  const prayers = summaries.filter((item) => prayerAttendanceTypes.includes(item.type));
  const mostMissingPrayer = prayers.reduce<AttendanceDashboardTypeSummary | null>((current, item) => {
    if (!current) {
      return item;
    }

    return item.missingClassCount > current.missingClassCount ? item : current;
  }, null);

  return {
    visibleClassCount: visibleActiveClassCount,
    daily,
    prayers,
    mostMissingPrayer: mostMissingPrayer && mostMissingPrayer.missingClassCount > 0 ? mostMissingPrayer : null,
  };
}

export async function getAttendanceSessionsForProfile(profile: ProfileRow, filters: AttendanceSessionListFilters = {}) {
  const visibleClasses = await getVisibleClasses(profile);
  const visibleClassIds = new Set(visibleClasses.map((classRow) => classRow.id));
  const sessions = await getSessionsByDateRange(profile, { from: filters.from, to: filters.to });
  const filteredSessions = sessions.filter((session) => {
    if (!visibleClassIds.has(session.class_id)) {
      return false;
    }

    if (filters.attendanceType && filters.attendanceType !== "all" && session.attendance_type !== filters.attendanceType) {
      return false;
    }

    if (filters.departmentId && session.department?.id !== filters.departmentId) {
      return false;
    }

    if (filters.classId && session.class_id !== filters.classId) {
      return false;
    }

    if (filters.status && filters.status !== "all" && session.completion_status !== filters.status) {
      return false;
    }

    if (filters.search) {
      const term = filters.search.trim().toLocaleLowerCase("tr-TR");
      const haystack = [session.course_class?.name ?? "", session.department?.name ?? "", session.taken_by_profile?.full_name ?? "", session.note ?? "", attendanceTypeLabels[session.attendance_type]]
        .join(" ")
        .toLocaleLowerCase("tr-TR");
      if (!haystack.includes(term)) {
        return false;
      }
    }

    return true;
  });

  const departments = await getDepartmentsByClassIds([...visibleClassIds]);
  const departmentMap = new Map(departments.map((department) => [department.id, department]));

  return {
    sessions: filteredSessions.map((session) => ({
      ...session,
      department: session.department ?? departmentMap.get(session.course_class?.department_id ?? "") ?? null,
    })),
    visibleClasses,
  };
}

export async function getAttendanceSessionById(profile: ProfileRow, sessionId: string) {
  const sessions = await getSessionsByDateRange(profile, {});
  return sessions.find((session) => session.id === sessionId) ?? null;
}

export async function getAttendanceSessionDetail(profile: ProfileRow, sessionId: string) {
  const session = await getAttendanceSessionById(profile, sessionId);
  if (!session) {
    return null;
  }

  const admin = createSupabaseAdminClient();
  const { data: records, error } = await admin.from("attendance_records").select("*").eq("session_id", sessionId).order("created_at", { ascending: true });

  if (error) {
    throw new Error("Yoklama kayıtları alınamadı.");
  }

  const studentIds = (records ?? []).map((record) => record.student_id);
  const { data: students, error: studentError } = await admin.from("students").select("*").in("id", studentIds.length > 0 ? studentIds : ["00000000-0000-0000-0000-000000000000"]);
  if (studentError) {
    throw new Error("Yoklama talebeleri alınamadı.");
  }

  const studentMap = new Map((students ?? []).map((student) => [student.id, student as StudentRow]));
  const mappedRecords = (records ?? []).map((record) => ({
    ...record,
    student: studentMap.get(record.student_id) ?? null,
  }));

  return {
    session,
    records: mappedRecords as AttendanceRecordWithRelations[],
  } as AttendanceSessionDetail;
}

export async function getAttendanceStudentSummary(profile: ProfileRow, studentId: string): Promise<AttendanceStudentSummary> {
  const admin = createSupabaseAdminClient();
  const { data: student, error: studentError } = await admin.from("students").select("*").eq("id", studentId).maybeSingle();

  if (studentError) {
    throw new Error("Talebe alınamadı.");
  }

  if (!student) {
    return {
      student: null,
      daily: emptyStudentDailySummary(),
      prayers: prayerAttendanceTypes.map((type) => buildEmptyDashboardSummary(type)),
      entries: [],
    };
  }

  const classRow = student.course_class_id ? await getClassById(student.course_class_id) : null;

  if (!canViewStudent(profile, classRow ? { department_id: classRow.department_id } : null)) {
    return {
      student: null,
      daily: emptyStudentDailySummary(),
      prayers: prayerAttendanceTypes.map((type) => buildEmptyDashboardSummary(type)),
      entries: [],
    };
  }

  const sessions = await getSessionsByStudentId(profile, studentId);
  const currentMonth = getIstanbulMonthKey(new Date());
  const monthlySessions = sessions.filter((session) => session.session.attendance_date.startsWith(currentMonth));
  const dailyEntries = monthlySessions.filter((session) => session.session.attendance_type === "daily");
  const prayerEntries = monthlySessions.filter((session) => prayerAttendanceTypes.includes(session.session.attendance_type));
  const daily = {
    takenCount: dailyEntries.length,
    presentCount: dailyEntries.filter((entry) => entry.status === "present").length,
    absentCount: dailyEntries.filter((entry) => entry.status === "absent").length,
    excusedCount: dailyEntries.filter((entry) => entry.status === "excused").length,
    lateCount: dailyEntries.filter((entry) => entry.status === "late").length,
  };

  const prayers = prayerAttendanceTypes.map((type) => {
    const entries = prayerEntries.filter((entry) => entry.session.attendance_type === type);
    const summary = buildEmptyDashboardSummary(type);
    summary.takenClassCount = entries.length;
    summary.presentCount = entries.filter((entry) => entry.status === "present").length;
    summary.absentCount = entries.filter((entry) => entry.status === "absent").length;
    summary.excusedCount = entries.filter((entry) => entry.status === "excused").length;
    summary.lateCount = entries.filter((entry) => entry.status === "late").length;
    return summary;
  });

  return {
    student: {
      ...(student as StudentRow),
      course_class: classRow,
      department: classRow ? await getDepartmentById(classRow.department_id) : null,
    } as StudentWithRelations,
    daily,
    prayers,
    entries: monthlySessions,
  };
}

export async function getAttendanceReportData(profile: ProfileRow, filters: AttendanceSessionListFilters = {}) {
  const { sessions } = await getAttendanceSessionsForProfile(profile, filters);
  const totalRecords = sessions.reduce((total, session) => total + session.record_count, 0);
  const dailySessions = sessions.filter((session) => session.attendance_type === "daily");
  const prayerSessions = sessions.filter((session) => prayerAttendanceTypes.includes(session.attendance_type));
  const completedSessionCount = sessions.filter((session) => session.completion_status === "completed").length;
  const draftSessionCount = sessions.filter((session) => session.completion_status === "draft").length;

  return {
    summary: {
      totalSessions: sessions.length,
      dailySessionCount: dailySessions.length,
      prayerSessionCount: prayerSessions.length,
      completedSessionCount,
      draftSessionCount,
      totalRecords,
      dailyRecords: aggregateRecordCounts(dailySessions),
      prayerRecords: aggregateRecordCounts(prayerSessions),
    } satisfies AttendanceReportSummary,
    rows: sessions.map((session) => ({
      ...session,
      filterLabel: attendanceTypeLabels[session.attendance_type],
    })) satisfies AttendanceReportRow[],
  };
}

async function getSessionsByDateRange(profile: ProfileRow, range: { from?: string; to?: string }) {
  const admin = createSupabaseAdminClient();
  const { data: sessions, error } = await admin
    .from("attendance_sessions")
    .select("*")
    .order("attendance_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Yoklama kayıtları alınamadı.");
  }

  const visibleClasses = await getVisibleClasses(profile);
  const classMap = new Map(visibleClasses.map((classRow) => [classRow.id, classRow]));
  const departments = await getDepartmentsByClassIds(visibleClasses.map((classRow) => classRow.id));
  const departmentMap = new Map(departments.map((department) => [department.id, department]));
  const takenByIds = Array.from(new Set((sessions ?? []).map((session) => session.taken_by).filter((value): value is string => Boolean(value))));
  const takenByProfiles = await getProfilesByIds(takenByIds);
  const takenByMap = new Map(takenByProfiles.map((row) => [row.id, row]));
  const sessionIds = (sessions ?? []).map((session) => session.id);
  const recordMap = await getAttendanceRecordMap(sessionIds);
  const activeStudentMap = await getActiveStudentCountMap(classMap);

  const filtered = (sessions ?? [])
    .filter((session) => {
      if (range.from && session.attendance_date < range.from) {
        return false;
      }

      if (range.to && session.attendance_date > range.to) {
        return false;
      }

      return true;
    })
    .map((session) => {
      const courseClass = classMap.get(session.class_id) ?? null;
      const department = courseClass ? departmentMap.get(courseClass.department_id) ?? null : null;
      const records = recordMap.get(session.id) ?? [];
      const counts = countAttendanceRecords(records);
      const activeStudentCount = courseClass ? activeStudentMap.get(courseClass.id) ?? 0 : 0;
      const completion_status = records.length >= activeStudentCount ? "completed" : "draft";

      return {
        ...(session as AttendanceSessionRow),
        course_class: courseClass,
        department,
        taken_by_profile: session.taken_by ? takenByMap.get(session.taken_by) ?? null : null,
        record_count: records.length,
        active_student_count: activeStudentCount,
        ...counts,
        completion_status,
      } satisfies AttendanceSessionWithRelations;
    });

  return filtered;
}

async function getAttendanceRecordMap(sessionIds: string[]) {
  const admin = createSupabaseAdminClient();
  if (sessionIds.length === 0) {
    return new Map<string, AttendanceRecordRow[]>();
  }

  const { data, error } = await admin.from("attendance_records").select("*").in("session_id", sessionIds);

  if (error) {
    throw new Error("Yoklama kayıtları alınamadı.");
  }

  const map = new Map<string, AttendanceRecordRow[]>();
  for (const record of (data ?? []) as AttendanceRecordRow[]) {
    const list = map.get(record.session_id) ?? [];
    list.push(record);
    map.set(record.session_id, list);
  }
  return map;
}

async function getProfilesByIds(ids: string[]) {
  const admin = createSupabaseAdminClient();
  if (ids.length === 0) {
    return [] as ProfileRow[];
  }

  const { data, error } = await admin.from("profiles").select("*").in("id", ids);

  if (error) {
    throw new Error("Kullanıcı bilgileri alınamadı.");
  }

  return (data ?? []) as ProfileRow[];
}

async function getVisibleClasses(profile: ProfileRow) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.from("classes").select("*").order("name", { ascending: true });

  if (error) {
    throw new Error("Sınıf bilgileri alınamadı.");
  }

  return (data ?? []).filter((classRow) => canViewAttendanceClass(profile, classRow));
}

async function getDepartmentsByClassIds(classIds: string[]) {
  const admin = createSupabaseAdminClient();
  if (classIds.length === 0) {
    return [] as DepartmentRow[];
  }

  const { data, error } = await admin.from("classes").select("department_id").in("id", classIds);
  if (error) {
    throw new Error("Bölüm bilgileri alınamadı.");
  }

  const departmentIds = Array.from(new Set((data ?? []).map((row) => row.department_id).filter(Boolean)));
  if (departmentIds.length === 0) {
    return [] as DepartmentRow[];
  }

  const departments = await admin.from("departments").select("*").in("id", departmentIds);
  if (departments.error) {
    throw new Error("Bölüm bilgileri alınamadı.");
  }

  return (departments.data ?? []) as DepartmentRow[];
}

async function getActiveStudentCountMap(classMap: Map<string, ClassRow>) {
  const admin = createSupabaseAdminClient();
  const classIds = Array.from(classMap.keys());
  if (classIds.length === 0) {
    return new Map<string, number>();
  }

  const { data, error } = await admin.from("students").select("id,course_class_id,status").in("course_class_id", classIds);

  if (error) {
    throw new Error("Talebe sayıları alınamadı.");
  }

  const map = new Map<string, number>();
  for (const classId of classIds) {
    map.set(classId, 0);
  }

  for (const student of (data ?? []) as Array<{ course_class_id: string | null; status: string }>) {
    if (student.course_class_id && student.status === "active") {
      map.set(student.course_class_id, (map.get(student.course_class_id) ?? 0) + 1);
    }
  }

  return map;
}

async function getSessionsByStudentId(profile: ProfileRow, studentId: string) {
  const admin = createSupabaseAdminClient();
  const { data: studentData, error: studentError } = await admin.from("students").select("*").eq("id", studentId).maybeSingle();

  if (studentError) {
    throw new Error("Talebe bilgisi alınamadı.");
  }

  if (!studentData) {
    return [] as AttendanceStudentHistoryEntry[];
  }

  const student = studentData as StudentRow;
  const courseClass = student.course_class_id ? await getClassById(student.course_class_id) : null;

  if (!canViewAttendanceClass(profile, courseClass)) {
    return [] as AttendanceStudentHistoryEntry[];
  }

  const { data: records, error } = await admin.from("attendance_records").select("*").eq("student_id", studentId).order("created_at", { ascending: false });
  if (error) {
    throw new Error("Talebe yoklama geçmişi alınamadı.");
  }

  const sessionIds = Array.from(new Set((records ?? []).map((record) => record.session_id)));
  const sessions = await getSessionsByIds(profile, sessionIds);
  const recordMap = new Map((records ?? []).map((record) => [record.session_id, record as AttendanceRecordRow]));

  return sessions
    .filter((session) => Boolean(recordMap.get(session.id)))
    .map((session) => ({
      id: session.id,
      status: (recordMap.get(session.id)?.status ?? "absent") as AttendanceRecordStatus,
      note: recordMap.get(session.id)?.note ?? null,
      session,
    }))
    .sort((left, right) => new Date(right.session.attendance_date).getTime() - new Date(left.session.attendance_date).getTime());
}

async function getSessionsByIds(profile: ProfileRow, sessionIds: string[]) {
  if (sessionIds.length === 0) {
    return [] as AttendanceSessionWithRelations[];
  }

  const sessions = await getSessionsByDateRange(profile, {});
  return sessions.filter((session) => sessionIds.includes(session.id));
}

async function getClassById(id: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.from("classes").select("*").eq("id", id).maybeSingle();

  if (error) {
    throw new Error("Sınıf bilgisi alınamadı.");
  }

  return data as ClassRow | null;
}

async function getDepartmentById(id: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.from("departments").select("*").eq("id", id).maybeSingle();

  if (error) {
    throw new Error("Bölüm bilgisi alınamadı.");
  }

  return data as DepartmentRow | null;
}

function countAttendanceRecords(records: AttendanceRecordRow[]) {
  return {
    present_count: records.filter((record) => record.status === "present").length,
    absent_count: records.filter((record) => record.status === "absent").length,
    excused_count: records.filter((record) => record.status === "excused").length,
    late_count: records.filter((record) => record.status === "late").length,
  };
}

function buildEmptyDashboardSummary(type: AttendanceType): AttendanceDashboardTypeSummary {
  return {
    type,
    label: attendanceTypeLabels[type],
    takenClassCount: 0,
    missingClassCount: 0,
    presentCount: 0,
    absentCount: 0,
    excusedCount: 0,
    lateCount: 0,
  };
}

function aggregateRecordCounts(sessions: AttendanceSessionWithRelations[]) {
  return {
    presentCount: sessions.reduce((total, session) => total + session.present_count, 0),
    absentCount: sessions.reduce((total, session) => total + session.absent_count, 0),
    excusedCount: sessions.reduce((total, session) => total + session.excused_count, 0),
    lateCount: sessions.reduce((total, session) => total + session.late_count, 0),
  };
}

function emptyStudentDailySummary() {
  return {
    takenCount: 0,
    presentCount: 0,
    absentCount: 0,
    excusedCount: 0,
    lateCount: 0,
  };
}

export async function getStudentAttendanceSummaryForParent(studentId: string): Promise<AttendanceStudentSummary> {
  const admin = createSupabaseAdminClient();
  const { data: student, error: studentError } = await admin.from("students").select("*").eq("id", studentId).maybeSingle();

  if (studentError || !student) {
    return {
      student: null,
      daily: emptyStudentDailySummary(),
      prayers: prayerAttendanceTypes.map((type) => buildEmptyDashboardSummary(type)),
      entries: [],
    };
  }

  const studentRow = student as StudentRow;
  const classRow = studentRow.course_class_id ? await getClassById(studentRow.course_class_id) : null;

  const { data: records, error: recordError } = await admin.from("attendance_records").select("*").eq("student_id", studentId).order("created_at", { ascending: false });
  if (recordError) {
    return {
      student: null,
      daily: emptyStudentDailySummary(),
      prayers: prayerAttendanceTypes.map((type) => buildEmptyDashboardSummary(type)),
      entries: [],
    };
  }

  const sessionIds = Array.from(new Set((records ?? []).map((record) => record.session_id)));
  let sessions: AttendanceSessionWithRelations[] = [];

  if (sessionIds.length > 0) {
    const { data: sessionData, error: sessionError } = await admin.from("attendance_sessions").select("*").in("id", sessionIds);
    if (!sessionError && sessionData) {
      const takenByIds = Array.from(new Set((sessionData as AttendanceSessionRow[]).map((s) => s.taken_by).filter((v): v is string => Boolean(v))));
      const takenByMap = new Map<string, ProfileRow>();
      if (takenByIds.length > 0) {
        const { data: profiles } = await admin.from("profiles").select("*").in("id", takenByIds);
        for (const p of (profiles ?? []) as ProfileRow[]) {
          takenByMap.set(p.id, p);
        }
      }

      sessions = (sessionData as AttendanceSessionRow[]).map((s) => ({
        ...s,
        course_class: classRow,
        department: classRow ? null : null,
        taken_by_profile: s.taken_by ? takenByMap.get(s.taken_by) ?? null : null,
        record_count: 0,
        active_student_count: 0,
        present_count: 0,
        absent_count: 0,
        excused_count: 0,
        late_count: 0,
        completion_status: "completed" as const,
      }));
    }
  }

  const recordMap = new Map((records ?? []).map((record) => [record.session_id, record as AttendanceRecordRow]));
  const entries: AttendanceStudentHistoryEntry[] = sessions
    .filter((session) => recordMap.has(session.id))
    .map((session) => ({
      id: session.id,
      status: (recordMap.get(session.id)?.status ?? "absent") as AttendanceRecordStatus,
      note: recordMap.get(session.id)?.note ?? null,
      session,
    }))
    .sort((a, b) => new Date(b.session.attendance_date).getTime() - new Date(a.session.attendance_date).getTime());

  const currentMonth = getIstanbulMonthKey(new Date());
  const monthlySessions = entries.filter((e) => e.session.attendance_date.startsWith(currentMonth));
  const dailyEntries = monthlySessions.filter((e) => e.session.attendance_type === "daily");
  const prayerEntries = monthlySessions.filter((e) => prayerAttendanceTypes.includes(e.session.attendance_type));

  return {
    student: {
      ...studentRow,
      course_class: classRow,
      department: classRow ? await getDepartmentById(classRow.department_id) : null,
    } as StudentWithRelations,
    daily: {
      takenCount: dailyEntries.length,
      presentCount: dailyEntries.filter((e) => e.status === "present").length,
      absentCount: dailyEntries.filter((e) => e.status === "absent").length,
      excusedCount: dailyEntries.filter((e) => e.status === "excused").length,
      lateCount: dailyEntries.filter((e) => e.status === "late").length,
    },
    prayers: prayerAttendanceTypes.map((type) => {
      const entries = prayerEntries.filter((e) => e.session.attendance_type === type);
      const summary = buildEmptyDashboardSummary(type);
      summary.takenClassCount = entries.length;
      summary.presentCount = entries.filter((e) => e.status === "present").length;
      summary.absentCount = entries.filter((e) => e.status === "absent").length;
      summary.excusedCount = entries.filter((e) => e.status === "excused").length;
      summary.lateCount = entries.filter((e) => e.status === "late").length;
      return summary;
    }),
    entries,
  };
}

function getIstanbulDateString(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "00";
  const day = parts.find((part) => part.type === "day")?.value ?? "00";

  return `${year}-${month}-${day}`;
}

function getIstanbulMonthKey(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "00";

  return `${year}-${month}`;
}
