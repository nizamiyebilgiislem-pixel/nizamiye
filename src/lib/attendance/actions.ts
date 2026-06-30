"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { buildAuditActor, createAuditLog } from "@/lib/audit/log";
import { requireAuth } from "@/lib/auth";
import { attendanceTypeLabels, attendanceTypes } from "@/lib/attendance/constants";
import { canManageAttendance, canManageAttendanceClass } from "@/lib/attendance/permissions";
import { getAttendanceSessionDetail, getDepartmentAttendanceDetail } from "@/lib/attendance/queries";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { assertDateWithinAcademicTerm, requireCurrentAcademicTermWritable } from "@/lib/terms/guards";
import type { AttendanceRecordStatus, AttendanceType, ClassRow, StudentRow } from "@/types/database";

function parseAttendanceType(value: FormDataEntryValue | null): AttendanceType {
  return attendanceTypes.includes(value as AttendanceType) ? (value as AttendanceType) : "daily";
}

function parseRecordStatus(value: FormDataEntryValue | null): AttendanceRecordStatus {
  return ["present", "absent", "excused", "late"].includes(String(value)) ? (value as AttendanceRecordStatus) : "absent";
}

function parseAttendanceScope(value: FormDataEntryValue | null) {
  return value === "department" ? "department" : "class";
}

export async function createAttendanceSessionAction(formData: FormData) {
  const { profile } = await requireAuth();
  if (!canManageAttendance(profile)) {
    redirect("/yoklama?error=unauthorized");
  }

  const attendanceDate = String(formData.get("attendance_date") ?? "").trim();
  const attendanceType = parseAttendanceType(formData.get("attendance_type"));
  const attendanceScope = parseAttendanceScope(formData.get("scope"));
  const classId = String(formData.get("class_id") ?? "").trim();
  const departmentId = String(formData.get("department_id") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  const admin = createSupabaseAdminClient();

  if (attendanceScope === "department") {
    await createDepartmentAttendanceSessions({
      admin,
      profile,
      attendanceDate,
      attendanceType,
      departmentId,
      note,
    });
  }

  const { data: classRow, error: classError } = await admin.from("classes").select("*").eq("id", classId).maybeSingle();
  if (classError || !classRow) {
    throw new Error("Sınıf bilgisi alınamadı.");
  }

  if (!canManageAttendanceClass(profile, classRow as ClassRow)) {
    redirect("/yoklama?error=unauthorized");
  }

  try {
    const currentTerm = await requireCurrentAcademicTermWritable();
    assertDateWithinAcademicTerm(attendanceDate, currentTerm, "Yoklama tarihi aktif dönem dışında.");
  } catch {
    redirect("/yoklama?error=term-closed");
  }

  const existing = await getExistingSessionId(classId, attendanceDate, attendanceType);
  if (existing) {
    redirect(`/yoklama/${existing}/duzenle?duplicate=1`);
  }

  const { data: session, error: sessionError } = await admin
    .from("attendance_sessions")
    .insert({
      class_id: classId,
      attendance_date: attendanceDate,
      attendance_type: attendanceType,
      taken_by: profile.id,
      note: note || null,
    })
    .select("*")
    .single();

  if (sessionError || !session) {
    if (sessionError?.code === "23505") {
      const existingSessionId = await getExistingSessionId(classId, attendanceDate, attendanceType);
      if (existingSessionId) {
        redirect(`/yoklama/${existingSessionId}/duzenle?duplicate=1`);
      }
    }
    throw new Error("Yoklama oturumu oluşturulamadı.");
  }

  const { data: students, error: studentsError } = await admin
    .from("students")
    .select("*")
    .eq("course_class_id", classId)
    .eq("status", "active")
    .order("full_name", { ascending: true });

  if (studentsError) {
    await admin.from("attendance_sessions").delete().eq("id", session.id);
    throw new Error("Sınıf talebeleri alınamadı.");
  }

  const studentRows = (students ?? []) as StudentRow[];
  if (studentRows.length > 0) {
    const { error: recordsError } = await admin.from("attendance_records").insert(
      studentRows.map((student) => ({
        session_id: session.id,
        student_id: student.id,
        status: "present",
        note: null,
        recorded_by: profile.id,
      })),
    );

    if (recordsError) {
      await admin.from("attendance_sessions").delete().eq("id", session.id);
      throw new Error("Yoklama kayıtları oluşturulamadı.");
    }
  }

  await createAuditLog({
    ...buildAuditActor(profile),
    action: "attendance_session_created",
    entityType: "attendance_session",
    entityId: session.id,
    title: `${attendanceTypeLabels[attendanceType]} oluşturuldu`,
    description: `${attendanceDate} tarihli ${attendanceTypeLabels[attendanceType]} oturumu oluşturuldu.`,
    afterData: {
      class_id: classId,
      attendance_date: attendanceDate,
      attendance_type: attendanceType,
      note: note || null,
      student_count: studentRows.length,
    },
    metadata: {
      attendance_type: attendanceType,
    },
  });

  revalidatePath("/yoklama");
  revalidatePath("/dashboard");
  redirect(`/yoklama/${session.id}/duzenle?success=created`);
}

async function createDepartmentAttendanceSessions(params: {
  admin: ReturnType<typeof createSupabaseAdminClient>;
  profile: Awaited<ReturnType<typeof requireAuth>>["profile"];
  attendanceDate: string;
  attendanceType: AttendanceType;
  departmentId: string;
  note: string;
}) {
  const scopedDepartmentId = params.profile.role === "bolum_muduru" ? params.profile.department_id ?? "" : params.departmentId;

  if (!scopedDepartmentId) {
    throw new Error("Bölüm bilgisi bulunamadı.");
  }

  try {
    const currentTerm = await requireCurrentAcademicTermWritable();
    assertDateWithinAcademicTerm(params.attendanceDate, currentTerm, "Yoklama tarihi aktif dönem dışında.");
  } catch {
    redirect("/yoklama?error=term-closed");
  }

  const { data: classes, error: classError } = await params.admin
    .from("classes")
    .select("*")
    .eq("department_id", scopedDepartmentId)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (classError || !classes || classes.length === 0) {
    throw new Error("Bölüm sınıfları alınamadı.");
  }

  const classRows = classes.filter((classRow) => canManageAttendanceClass(params.profile, classRow as ClassRow)) as ClassRow[];

  if (classRows.length === 0) {
    redirect("/yoklama?error=unauthorized");
  }

  const classIds = classRows.map((classRow) => classRow.id);
  const { data: existingSessions, error: existingError } = await params.admin
    .from("attendance_sessions")
    .select("*")
    .in("class_id", classIds)
    .eq("attendance_date", params.attendanceDate)
    .eq("attendance_type", params.attendanceType);

  if (existingError) {
    throw new Error("Mevcut bölüm yoklamaları kontrol edilemedi.");
  }

  const existingByClassId = new Map((existingSessions ?? []).map((session) => [session.class_id, session]));
  const classesToCreate = classRows.filter((classRow) => !existingByClassId.has(classRow.id));

  if (classesToCreate.length > 0) {
    const { error: createError } = await params.admin.from("attendance_sessions").insert(
      classesToCreate.map((classRow) => ({
        class_id: classRow.id,
        attendance_date: params.attendanceDate,
        attendance_type: params.attendanceType,
        taken_by: params.profile.id,
        note: params.note || null,
      })),
    );

    if (createError) {
      throw new Error("Bölüm yoklama oturumları oluşturulamadı.");
    }
  }

  const { data: sessions, error: sessionError } = await params.admin
    .from("attendance_sessions")
    .select("*")
    .in("class_id", classIds)
    .eq("attendance_date", params.attendanceDate)
    .eq("attendance_type", params.attendanceType);

  if (sessionError || !sessions || sessions.length === 0) {
    throw new Error("Bölüm yoklama oturumları alınamadı.");
  }

  const sessionIds = sessions.map((session) => session.id);
  const sessionByClassId = new Map(sessions.map((session) => [session.class_id, session]));

  const { data: students, error: studentsError } = await params.admin
    .from("students")
    .select("*")
    .in("course_class_id", classIds)
    .eq("status", "active")
    .order("full_name", { ascending: true });

  if (studentsError) {
    throw new Error("Bölüm talebeleri alınamadı.");
  }

  const { data: existingRecords, error: existingRecordsError } = await params.admin
    .from("attendance_records")
    .select("session_id, student_id")
    .in("session_id", sessionIds);

  if (existingRecordsError) {
    throw new Error("Mevcut yoklama kayıtları kontrol edilemedi.");
  }

  const recordKeySet = new Set((existingRecords ?? []).map((record) => `${record.session_id}:${record.student_id}`));
  const studentRows = (students ?? []) as StudentRow[];
  const missingRecords = studentRows.flatMap((student) => {
    const session = sessionByClassId.get(student.course_class_id ?? "");
    if (!session) {
      return [];
    }

    const key = `${session.id}:${student.id}`;
    if (recordKeySet.has(key)) {
      return [];
    }

    return [{
      session_id: session.id,
      student_id: student.id,
      status: "present" as const,
      note: null,
      recorded_by: params.profile.id,
    }];
  });

  if (missingRecords.length > 0) {
    const { error: recordInsertError } = await params.admin.from("attendance_records").insert(missingRecords);
    if (recordInsertError) {
      throw new Error("Bölüm yoklama kayıtları oluşturulamadı.");
    }
  }

  await createAuditLog({
    ...buildAuditActor(params.profile),
    action: "department_attendance_session_created",
    entityType: "attendance_session",
    entityId: sessions[0]?.id ?? null,
    title: `${attendanceTypeLabels[params.attendanceType]} oluşturuldu`,
    description: `${params.attendanceDate} tarihli bölüm yoklaması oluşturuldu.`,
    afterData: {
      department_id: scopedDepartmentId,
      attendance_date: params.attendanceDate,
      attendance_type: params.attendanceType,
      class_count: classRows.length,
      student_count: studentRows.length,
    },
    metadata: {
      scope: "department",
      attendance_type: params.attendanceType,
    },
  });

  revalidatePath("/yoklama");
  revalidatePath("/dashboard");
  redirect(`/yoklama/bolum?departmentId=${scopedDepartmentId}&date=${params.attendanceDate}&attendanceType=${params.attendanceType}&success=created`);
}

export async function updateAttendanceSessionAction(formData: FormData) {
  const { profile } = await requireAuth();
  if (!canManageAttendance(profile)) {
    redirect("/yoklama?error=unauthorized");
  }

  const sessionId = String(formData.get("session_id") ?? "").trim();
  const sessionNote = String(formData.get("session_note") ?? "").trim();
  const detail = await getAttendanceSessionDetail(profile, sessionId);

  if (!detail) {
    redirect("/yoklama?error=not-found");
  }

  try {
    const currentTerm = await requireCurrentAcademicTermWritable();
    assertDateWithinAcademicTerm(detail.session.attendance_date, currentTerm, "Bu yoklama oturumu kapalı dönem içinde yer alıyor.");
  } catch {
    redirect("/yoklama?error=term-closed");
  }

  const admin = createSupabaseAdminClient();
  const sessionBefore = detail.session;
  const updatedSessionNote = sessionNote || null;
  const { error: sessionError } = await admin
    .from("attendance_sessions")
    .update({
      note: updatedSessionNote,
      taken_by: sessionBefore.taken_by ?? profile.id,
    })
    .eq("id", sessionId);

  if (sessionError) {
    throw new Error("Yoklama oturumu güncellenemedi.");
  }

  if ((sessionBefore.note ?? "") !== (updatedSessionNote ?? "")) {
    await createAuditLog({
      ...buildAuditActor(profile),
      action: "attendance_session_updated",
      entityType: "attendance_session",
      entityId: sessionId,
      title: `${attendanceTypeLabels[sessionBefore.attendance_type]} güncellendi`,
      description: `${sessionBefore.attendance_date} tarihli oturum notu güncellendi.`,
      beforeData: { note: sessionBefore.note },
      afterData: { note: updatedSessionNote },
      metadata: { attendance_type: sessionBefore.attendance_type },
    });
  }

  const recordIds = formData.getAll("record_id").map((value) => String(value));
  for (const recordId of recordIds) {
    const status = parseRecordStatus(formData.get(`status_${recordId}`));
    const note = String(formData.get(`note_${recordId}`) ?? "").trim();
    const currentRecord = detail.records.find((record) => record.id === recordId);
    if (!currentRecord) {
      continue;
    }

    const before = {
      status: currentRecord.status,
      note: currentRecord.note,
    };
    const after = {
      status,
      note: note || null,
    };

    const changed = before.status !== after.status || before.note !== after.note;
    if (!changed) {
      continue;
    }

    const { error: recordError } = await admin
      .from("attendance_records")
      .update({
        status,
        note: note || null,
        recorded_by: profile.id,
      })
      .eq("id", recordId);

    if (recordError) {
      throw new Error("Yoklama kaydı güncellenemedi.");
    }

    await createAuditLog({
      ...buildAuditActor(profile),
      action: "attendance_record_changed",
      entityType: "attendance_record",
      entityId: recordId,
      studentId: currentRecord.student_id,
      title: `${currentRecord.student?.full_name ?? "Talebe"} yoklama durumu güncellendi`,
      description: `${attendanceTypeLabels[sessionBefore.attendance_type]} için kayıt güncellendi.`,
      beforeData: before,
      afterData: after,
      metadata: {
        attendance_type: sessionBefore.attendance_type,
        session_id: sessionId,
        class_id: sessionBefore.class_id,
        attendance_date: sessionBefore.attendance_date,
      },
    });
  }

  revalidatePath("/yoklama");
  revalidatePath(`/yoklama/${sessionId}`);
  revalidatePath(`/yoklama/${sessionId}/duzenle`);
  revalidatePath("/dashboard");
  redirect(`/yoklama/${sessionId}?success=updated`);
}

export async function updateDepartmentAttendanceAction(formData: FormData) {
  const { profile } = await requireAuth();
  if (!canManageAttendance(profile)) {
    redirect("/yoklama?error=unauthorized");
  }

  const departmentId = String(formData.get("department_id") ?? "").trim();
  const attendanceDate = String(formData.get("attendance_date") ?? "").trim();
  const attendanceType = parseAttendanceType(formData.get("attendance_type"));
  const recordIds = formData.getAll("record_id").map((value) => String(value));
  const admin = createSupabaseAdminClient();
  const detail = await getDepartmentAttendanceDetail(profile, departmentId, attendanceDate, attendanceType);

  if (!detail) {
    redirect("/yoklama?error=unauthorized");
  }

  const allowedRecordIds = new Set(detail.records.map((record) => record.id));

  for (const recordId of recordIds) {
    if (!allowedRecordIds.has(recordId)) {
      continue;
    }

    const status = parseRecordStatus(formData.get(`status_${recordId}`));
    const note = String(formData.get(`note_${recordId}`) ?? "").trim();

    const { data: currentRecord, error: currentRecordError } = await admin
      .from("attendance_records")
      .select("id, student_id, status, note")
      .eq("id", recordId)
      .maybeSingle();

    if (currentRecordError || !currentRecord) {
      throw new Error("Bölüm yoklama kaydı alınamadı.");
    }

    if (currentRecord.status === status && (currentRecord.note ?? "") === note) {
      continue;
    }

    const { error: recordError } = await admin
      .from("attendance_records")
      .update({
        status,
        note: note || null,
        recorded_by: profile.id,
      })
      .eq("id", recordId);

    if (recordError) {
      throw new Error("Bölüm yoklama kaydı güncellenemedi.");
    }
  }

  revalidatePath("/yoklama");
  revalidatePath(`/yoklama/bolum?departmentId=${departmentId}&date=${attendanceDate}&attendanceType=${attendanceType}`);
  revalidatePath("/dashboard");
  redirect(`/yoklama/bolum?departmentId=${departmentId}&date=${attendanceDate}&attendanceType=${attendanceType}&success=updated`);
}

async function getExistingSessionId(classId: string, attendanceDate: string, attendanceType: AttendanceType) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("attendance_sessions")
    .select("id")
    .eq("class_id", classId)
    .eq("attendance_date", attendanceDate)
    .eq("attendance_type", attendanceType)
    .maybeSingle();

  if (error) {
    throw new Error("Mevcut yoklama kontrolü yapılamadı.");
  }

  return data?.id ?? null;
}
