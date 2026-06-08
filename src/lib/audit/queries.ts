import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ProfileRow, StudentRow } from "@/types/database";

export type AuditLogFilters = {
  action?: string;
  entityType?: string;
  from?: string;
  to?: string;
  actor?: string;
  student?: string;
  search?: string;
};

export type AuditLogRow = {
  id: string;
  actor_profile_id: string | null;
  actor_name: string;
  actor_role: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  student_id: string | null;
  title: string;
  description: string | null;
  before_data: unknown | null;
  after_data: unknown | null;
  metadata: unknown | null;
  created_at: string;
};

export type AuditLogEntry = AuditLogRow & {
  student: StudentRow | null;
};

export async function getAuditLogsForProfile(profile: ProfileRow, filters: AuditLogFilters = {}) {
  const admin = createSupabaseAdminClient();
  const visibleStudentIds = await getVisibleStudentIds(profile);

  if (profile.role === "veli") {
    return [];
  }

  const { data, error } = await admin.from("audit_logs").select("*").order("created_at", { ascending: false });

  if (error) {
    throw new Error("Audit logları alınamadı.");
  }

  const logs = (data ?? []) as AuditLogRow[];
  const filtered = await filterAuditLogs(admin, logs, visibleStudentIds, filters);
  return attachStudents(admin, filtered);
}

export async function getAuditLogByIdForProfile(profile: ProfileRow, id: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.from("audit_logs").select("*").eq("id", id).maybeSingle();

  if (error) {
    throw new Error("Audit log detayı alınamadı.");
  }

  if (!data) {
    return null;
  }

  const log = data as AuditLogRow;
  const visibleStudentIds = await getVisibleStudentIds(profile);

  if (profile.role === "veli") {
    return null;
  }

  if (!canViewAuditLogForProfile(profile, log, visibleStudentIds)) {
    return null;
  }

  const [entry] = await attachStudents(admin, [log]);
  return entry ?? null;
}

export async function getStudentAuditLogs(profile: ProfileRow, studentId: string) {
  const admin = createSupabaseAdminClient();
  const visibleStudentIds = await getVisibleStudentIds(profile);

  if (profile.role === "veli") {
    return [];
  }

  if (!canViewStudentAuditLog(profile, studentId, visibleStudentIds)) {
    return [];
  }

  const { data, error } = await admin
    .from("audit_logs")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Talebe geçmişi alınamadı.");
  }

  return attachStudents(admin, (data ?? []) as AuditLogRow[]);
}

async function filterAuditLogs(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  logs: AuditLogRow[],
  visibleStudentIds: Set<string> | null,
  filters: AuditLogFilters,
) {
  const studentMap = await buildStudentMap(admin, logs);

  return logs.filter((log) => {
    if (visibleStudentIds && !log.student_id) {
      return false;
    }

    if (visibleStudentIds && log.student_id && !visibleStudentIds.has(log.student_id)) {
      return false;
    }

    if (filters.action && log.action !== filters.action) {
      return false;
    }

    if (filters.entityType && log.entity_type !== filters.entityType) {
      return false;
    }

    if (filters.from && new Date(log.created_at) < new Date(`${filters.from}T00:00:00`)) {
      return false;
    }

    if (filters.to && new Date(log.created_at) > new Date(`${filters.to}T23:59:59.999`)) {
      return false;
    }

    if (filters.actor) {
      const term = filters.actor.trim().toLocaleLowerCase("tr-TR");
      const actorName = log.actor_name.toLocaleLowerCase("tr-TR");
      if (!actorName.includes(term)) {
        return false;
      }
    }

    if (filters.student) {
      const term = filters.student.trim().toLocaleLowerCase("tr-TR");
      const student = log.student_id ? studentMap.get(log.student_id) ?? null : null;
      const studentName = student?.full_name.toLocaleLowerCase("tr-TR") ?? "";
      if (!studentName.includes(term)) {
        return false;
      }
    }

    if (filters.search) {
      const term = filters.search.trim().toLocaleLowerCase("tr-TR");
      const student = log.student_id ? studentMap.get(log.student_id) ?? null : null;
      const haystack = [log.title, log.description ?? "", log.actor_name, student?.full_name ?? ""]
        .join(" ")
        .toLocaleLowerCase("tr-TR");
      if (!haystack.includes(term)) {
        return false;
      }
    }

    return true;
  });
}

async function attachStudents(admin: ReturnType<typeof createSupabaseAdminClient>, logs: AuditLogRow[]) {
  const studentMap = await buildStudentMap(admin, logs);
  return logs.map((log) => ({
    ...log,
    student: log.student_id ? studentMap.get(log.student_id) ?? null : null,
  }));
}

async function buildStudentMap(admin: ReturnType<typeof createSupabaseAdminClient>, logs: AuditLogRow[]) {
  const studentIds = Array.from(new Set(logs.map((log) => log.student_id).filter((value): value is string => Boolean(value))));

  if (studentIds.length === 0) {
    return new Map<string, StudentRow>();
  }

  const { data, error } = await admin.from("students").select("*").in("id", studentIds);

  if (error) {
    throw new Error("Talebe verisi alınamadı.");
  }

  return new Map((data ?? []).map((student) => [student.id, student as StudentRow]));
}

async function getVisibleStudentIds(profile: ProfileRow) {
  const admin = createSupabaseAdminClient();

  if (profile.role === "admin" || profile.role === "genel_mudur") {
    return null;
  }

  const classQuery = admin.from("classes").select("id,department_id,class_teacher_id");
  const studentQuery = admin.from("students").select("id,course_class_id");

  const [classesResult, studentsResult] = await Promise.all([classQuery, studentQuery]);

  if (classesResult.error || studentsResult.error) {
    throw new Error("Audit görünürlük verisi alınamadı.");
  }

  const visibleClassIds = new Set(
    (classesResult.data ?? [])
      .filter((classRow) => {
        if (profile.role === "bolum_muduru") {
          return classRow.department_id === profile.department_id;
        }

        if (profile.role === "hoca") {
          return classRow.class_teacher_id === profile.id;
        }

        return false;
      })
      .map((classRow) => classRow.id),
  );

  const visibleStudentIds = new Set(
    (studentsResult.data ?? [])
      .filter((student) => student.course_class_id && visibleClassIds.has(student.course_class_id))
      .map((student) => student.id),
  );

  return visibleStudentIds;
}

function canViewAuditLogForProfile(profile: ProfileRow, log: AuditLogRow, visibleStudentIds: Set<string> | null) {
  if (profile.role === "admin" || profile.role === "genel_mudur") {
    return true;
  }

  if (!visibleStudentIds) {
    return false;
  }

  return log.student_id ? visibleStudentIds.has(log.student_id) : false;
}

function canViewStudentAuditLog(profile: ProfileRow, studentId: string, visibleStudentIds: Set<string> | null) {
  if (profile.role === "admin" || profile.role === "genel_mudur") {
    return true;
  }

  if (!visibleStudentIds) {
    return false;
  }

  return visibleStudentIds.has(studentId);
}
