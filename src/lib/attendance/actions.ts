"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { buildAuditActor, createAuditLog } from "@/lib/audit/log";
import { requireAuth } from "@/lib/auth";
import { attendanceTypeLabels, attendanceTypes } from "@/lib/attendance/constants";
import { canManageAttendance, canManageAttendanceClass } from "@/lib/attendance/permissions";
import { getAttendanceSessionDetail } from "@/lib/attendance/queries";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AttendanceRecordStatus, AttendanceType, ClassRow, StudentRow } from "@/types/database";

function parseAttendanceType(value: FormDataEntryValue | null): AttendanceType {
  return attendanceTypes.includes(value as AttendanceType) ? (value as AttendanceType) : "daily";
}

function parseRecordStatus(value: FormDataEntryValue | null): AttendanceRecordStatus {
  return ["present", "absent", "excused", "late"].includes(String(value)) ? (value as AttendanceRecordStatus) : "absent";
}

export async function createAttendanceSessionAction(formData: FormData) {
  const { profile } = await requireAuth();
  if (!canManageAttendance(profile)) {
    redirect("/yoklama?error=unauthorized");
  }

  const attendanceDate = String(formData.get("attendance_date") ?? "").trim();
  const attendanceType = parseAttendanceType(formData.get("attendance_type"));
  const classId = String(formData.get("class_id") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  const admin = createSupabaseAdminClient();

  const { data: classRow, error: classError } = await admin.from("classes").select("*").eq("id", classId).maybeSingle();
  if (classError || !classRow) {
    throw new Error("Sınıf bilgisi alınamadı.");
  }

  if (!canManageAttendanceClass(profile, classRow as ClassRow)) {
    redirect("/yoklama?error=unauthorized");
  }

  const existing = await getExistingSessionId(classId, attendanceDate, attendanceType);
  if (existing) {
    redirect(`/yoklama/${existing}?duplicate=1`);
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
        redirect(`/yoklama/${existingSessionId}?duplicate=1`);
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
        status: "absent",
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
  redirect(`/yoklama/${session.id}`);
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
