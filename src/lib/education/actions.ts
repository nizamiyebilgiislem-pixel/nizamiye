"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAuth } from "@/lib/auth";
import {
  getEducationAssignmentData,
  getEducationClassById,
  getEducationScheduleData,
} from "@/lib/education/queries";
import {
  canManageClassAssignments,
  canManageClassSchedule,
} from "@/lib/education/permissions";
import { buildAuditActor, createAuditLog } from "@/lib/audit/log";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const uuidSchema = z.string().uuid("Geçerli bir kayıt seçilmelidir.");
const optionalUuidSchema = z
  .union([z.string().uuid(), z.literal("")])
  .optional()
  .transform((value) => (value && value.length > 0 ? value : null));
const booleanStringSchema = z.enum(["true", "false"]).default("true").transform((value) => value === "true");
const optionalTextSchema = z.string().trim().optional().transform((value) => (value && value.length > 0 ? value : null));
const timeSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : null))
  .refine((value) => value === null || /^([01]\d|2[0-3]):[0-5]\d$/.test(value), "Saat HH:MM formatında olmalıdır.");

const classCourseCreateSchema = z.object({
  class_id: uuidSchema,
  course_id: uuidSchema,
  teacher_id: optionalUuidSchema,
  is_active: booleanStringSchema,
});

const classCourseUpdateSchema = z.object({
  id: uuidSchema,
  teacher_id: optionalUuidSchema,
  is_active: booleanStringSchema,
});

const scheduleSlotCreateSchema = z.object({
  class_id: uuidSchema,
  class_course_id: uuidSchema,
  day_of_week: z.coerce.number().int().min(1, "Gün seçilmelidir.").max(7, "Gün seçilmelidir."),
  period_no: z.coerce.number().int().min(1, "Ders saati en az 1 olmalıdır."),
  start_time: timeSchema,
  end_time: timeSchema,
  room: optionalTextSchema,
  note: optionalTextSchema,
});

const scheduleSlotUpdateSchema = scheduleSlotCreateSchema.extend({
  id: uuidSchema,
});

function logSupabaseActionError(context: string, error: { code?: string | null; message?: string | null; details?: string | null; hint?: string | null }, payload: Record<string, unknown>, currentProfile: unknown) {
  console.error(`[education:${context}] supabase error`, {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
    payload,
    currentProfile,
  });
}

function mapSupabaseErrorToEducationMessage(error: { code?: string | null; message?: string | null }) {
  if (error.code === "23505") {
    return "duplicate";
  }

  if (error.code === "42501") {
    return "policy";
  }

  if (error.code === "23503") {
    return "teacher";
  }

  return "save";
}

export async function createClassCourseAction(formData: FormData) {
  const { profile } = await requireAuth();
  const payload = {
    class_id: String(formData.get("class_id") ?? ""),
    course_id: String(formData.get("course_id") ?? ""),
    teacher_id: String(formData.get("teacher_id") ?? ""),
    is_active: String(formData.get("is_active") ?? "true"),
  };
  const parsed = classCourseCreateSchema.safeParse(payload);

  if (!parsed.success) {
    redirect(`/egitim-planlama/ders-atamalari/${payload.class_id || ""}?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Form hatalı.")}`);
  }

  const classRow = await getEducationClassById(profile, parsed.data.class_id);
  if (!classRow) {
    redirect("/egitim-planlama/ders-atamalari?error=not-found");
  }

  if (!canManageClassAssignments(profile, classRow)) {
    redirect(`/egitim-planlama/ders-atamalari/${classRow.id}?error=unauthorized`);
  }

  const assignmentData = await getEducationAssignmentData(profile, classRow.id);
  if (!assignmentData) {
    redirect(`/egitim-planlama/ders-atamalari/${classRow.id}?error=not-found`);
  }

  if (!assignmentData.availableCourses.some((course) => course.id === parsed.data.course_id)) {
    redirect(`/egitim-planlama/ders-atamalari/${classRow.id}?error=duplicate`);
  }

  if (parsed.data.teacher_id && !assignmentData.availableTeachers.some((teacher) => teacher.id === parsed.data.teacher_id)) {
    redirect(`/egitim-planlama/ders-atamalari/${classRow.id}?error=teacher`);
  }

  const supabase = await createSupabaseServerClient();
  const { data: inserted, error } = await supabase
    .from("class_courses")
    .insert({
      class_id: classRow.id,
      course_id: parsed.data.course_id,
      teacher_id: parsed.data.teacher_id,
      is_active: parsed.data.is_active,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    logSupabaseActionError("createClassCourse", error, { ...parsed.data, class_id: classRow.id }, profile);
    redirect(`/egitim-planlama/ders-atamalari/${classRow.id}?error=${mapSupabaseErrorToEducationMessage(error ?? {})}`);
  }

  await createAuditLog({
    ...buildAuditActor(profile),
    action: "class_course_created",
    title: "Sınıfa ders atandı",
    description: `${classRow.name} sınıfına ders ataması yapıldı.`,
    entityType: "class_course",
    entityId: inserted.id,
    beforeData: null,
    afterData: {
      class_id: classRow.id,
      course_id: parsed.data.course_id,
      teacher_id: parsed.data.teacher_id,
      is_active: parsed.data.is_active,
    },
  });

  revalidatePath("/egitim-planlama");
  revalidatePath(`/egitim-planlama/ders-atamalari/${classRow.id}`);
  revalidatePath(`/egitim-planlama/ders-programi/${classRow.id}`);
  redirect(`/egitim-planlama/ders-atamalari/${classRow.id}?success=saved`);
}

export async function updateClassCourseAction(formData: FormData) {
  const { profile } = await requireAuth();
  const payload = {
    id: String(formData.get("id") ?? ""),
    teacher_id: String(formData.get("teacher_id") ?? ""),
    is_active: String(formData.get("is_active") ?? "true"),
  };
  const parsed = classCourseUpdateSchema.safeParse(payload);

  if (!parsed.success) {
    redirect(`/egitim-planlama/ders-atamalari?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Form hatalı.")}`);
  }

  const supabase = await createSupabaseServerClient();
  const { data: classCourse, error: lookupError } = await supabase.from("class_courses").select("*").eq("id", parsed.data.id).maybeSingle();

  if (lookupError || !classCourse) {
    redirect("/egitim-planlama/ders-atamalari?error=not-found");
  }

  const classRow = await getEducationClassById(profile, classCourse.class_id);
  if (!classRow || !canManageClassAssignments(profile, classRow)) {
    redirect(`/egitim-planlama/ders-atamalari/${classCourse.class_id}?error=unauthorized`);
  }

  const assignmentData = await getEducationAssignmentData(profile, classCourse.class_id);
  if (!assignmentData) {
    redirect(`/egitim-planlama/ders-atamalari/${classCourse.class_id}?error=not-found`);
  }

  if (parsed.data.teacher_id && !assignmentData.availableTeachers.some((teacher) => teacher.id === parsed.data.teacher_id)) {
    redirect(`/egitim-planlama/ders-atamalari/${classCourse.class_id}?error=teacher`);
  }

  const { error } = await supabase
    .from("class_courses")
    .update({
      teacher_id: parsed.data.teacher_id ?? null,
      is_active: parsed.data.is_active,
    })
    .eq("id", parsed.data.id);

  if (error) {
    logSupabaseActionError("updateClassCourse", error, { ...parsed.data, class_id: classCourse.class_id }, profile);
    redirect(`/egitim-planlama/ders-atamalari/${classCourse.class_id}?error=${mapSupabaseErrorToEducationMessage(error)}`);
  }

  await createAuditLog({
    ...buildAuditActor(profile),
    action: "class_course_updated",
    title: "Derse hoca atandı",
    description: `${classRow.name} sınıfındaki ders ataması güncellendi.`,
    entityType: "class_course",
    entityId: classCourse.id,
    beforeData: classCourse,
    afterData: {
      teacher_id: parsed.data.teacher_id ?? null,
      is_active: parsed.data.is_active,
    },
    metadata: {
      class_id: classCourse.class_id,
    },
  });

  revalidatePath("/egitim-planlama");
  revalidatePath(`/egitim-planlama/ders-atamalari/${classCourse.class_id}`);
  revalidatePath(`/egitim-planlama/ders-programi/${classCourse.class_id}`);
  redirect(`/egitim-planlama/ders-atamalari/${classCourse.class_id}?success=saved`);
}

export async function createScheduleSlotAction(formData: FormData) {
  const { profile } = await requireAuth();
  const payload = {
    class_id: String(formData.get("class_id") ?? ""),
    class_course_id: String(formData.get("class_course_id") ?? ""),
    day_of_week: String(formData.get("day_of_week") ?? ""),
    period_no: String(formData.get("period_no") ?? ""),
    start_time: String(formData.get("start_time") ?? ""),
    end_time: String(formData.get("end_time") ?? ""),
    room: String(formData.get("room") ?? ""),
    note: String(formData.get("note") ?? ""),
  };
  const parsed = scheduleSlotCreateSchema.safeParse(payload);

  if (!parsed.success) {
    redirect(`/egitim-planlama/ders-programi/${payload.class_id || ""}?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Form hatalı.")}`);
  }

  const classRow = await getEducationClassById(profile, parsed.data.class_id);
  if (!classRow) {
    redirect("/egitim-planlama/ders-programi?error=not-found");
  }

  if (!canManageClassSchedule(profile, classRow)) {
    redirect(`/egitim-planlama/ders-programi/${classRow.id}?error=unauthorized`);
  }

  const scheduleData = await getEducationScheduleData(profile, classRow.id);
  if (!scheduleData) {
    redirect(`/egitim-planlama/ders-programi/${classRow.id}?error=not-found`);
  }

  const classCourse = scheduleData.classCourses.find((row) => row.id === parsed.data.class_course_id);
  if (!classCourse || !classCourse.is_active) {
    redirect(`/egitim-planlama/ders-programi/${classRow.id}?error=course`);
  }

  const supabaseExisting = await createSupabaseServerClient();
  const { data: existing } = await supabaseExisting
    .from("weekly_schedule_slots")
    .select("id")
    .eq("class_id", classRow.id)
    .eq("day_of_week", parsed.data.day_of_week)
    .eq("period_no", parsed.data.period_no)
    .maybeSingle();

  if (existing) {
    redirect(`/egitim-planlama/ders-programi/${classRow.id}?error=duplicate-slot`);
  }

  const supabase = await createSupabaseServerClient();
  const { data: inserted, error } = await supabase
    .from("weekly_schedule_slots")
    .insert({
      class_id: classRow.id,
      class_course_id: parsed.data.class_course_id,
      day_of_week: parsed.data.day_of_week,
      period_no: parsed.data.period_no,
      start_time: parsed.data.start_time,
      end_time: parsed.data.end_time,
      room: parsed.data.room,
      note: parsed.data.note,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    logSupabaseActionError("createScheduleSlot", error, { ...parsed.data, class_id: classRow.id }, profile);
    redirect(
      `/egitim-planlama/ders-programi/${classRow.id}?error=${
        error?.code === "23505" ? "duplicate-slot" : mapSupabaseErrorToEducationMessage(error ?? {})
      }`,
    );
  }

  await createAuditLog({
    ...buildAuditActor(profile),
    action: "schedule_slot_created",
    title: "Ders programı slotu oluşturuldu",
    description: `${classRow.name} için yeni ders programı slotu oluşturuldu.`,
    entityType: "weekly_schedule_slot",
    entityId: inserted.id,
    studentId: null,
    beforeData: null,
    afterData: {
      class_id: classRow.id,
      class_course_id: parsed.data.class_course_id,
      day_of_week: parsed.data.day_of_week,
      period_no: parsed.data.period_no,
      start_time: parsed.data.start_time,
      end_time: parsed.data.end_time,
      room: parsed.data.room,
      note: parsed.data.note,
    },
  });

  revalidatePath("/egitim-planlama");
  revalidatePath(`/egitim-planlama/ders-programi/${classRow.id}`);
  revalidatePath(`/egitim-planlama/ders-atamalari/${classRow.id}`);
  redirect(`/egitim-planlama/ders-programi/${classRow.id}?saved=1`);
}

export async function updateScheduleSlotAction(formData: FormData) {
  const { profile } = await requireAuth();
  const payload = {
    id: String(formData.get("id") ?? ""),
    class_id: String(formData.get("class_id") ?? ""),
    class_course_id: String(formData.get("class_course_id") ?? ""),
    day_of_week: String(formData.get("day_of_week") ?? ""),
    period_no: String(formData.get("period_no") ?? ""),
    start_time: String(formData.get("start_time") ?? ""),
    end_time: String(formData.get("end_time") ?? ""),
    room: String(formData.get("room") ?? ""),
    note: String(formData.get("note") ?? ""),
  };
  const parsed = scheduleSlotUpdateSchema.safeParse(payload);

  if (!parsed.success) {
    redirect(`/egitim-planlama/ders-programi/${payload.class_id || ""}?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Form hatalı.")}`);
  }

  const classRow = await getEducationClassById(profile, parsed.data.class_id);
  if (!classRow) {
    redirect("/egitim-planlama/ders-programi?error=not-found");
  }

  if (!canManageClassSchedule(profile, classRow)) {
    redirect(`/egitim-planlama/ders-programi/${classRow.id}?error=unauthorized`);
  }

  const scheduleData = await getEducationScheduleData(profile, classRow.id);
  if (!scheduleData) {
    redirect(`/egitim-planlama/ders-programi/${classRow.id}?error=not-found`);
  }

  const classCourse = scheduleData.classCourses.find((row) => row.id === parsed.data.class_course_id);
  if (!classCourse || !classCourse.is_active) {
    redirect(`/egitim-planlama/ders-programi/${classRow.id}?error=course`);
  }

  const supabaseExisting = await createSupabaseServerClient();
  const { data: existing } = await supabaseExisting
    .from("weekly_schedule_slots")
    .select("id")
    .eq("class_id", classRow.id)
    .eq("day_of_week", parsed.data.day_of_week)
    .eq("period_no", parsed.data.period_no)
    .neq("id", parsed.data.id)
    .maybeSingle();

  if (existing) {
    redirect(`/egitim-planlama/ders-programi/${classRow.id}?error=duplicate-slot`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("weekly_schedule_slots")
    .update({
      class_course_id: parsed.data.class_course_id,
      day_of_week: parsed.data.day_of_week,
      period_no: parsed.data.period_no,
      start_time: parsed.data.start_time,
      end_time: parsed.data.end_time,
      room: parsed.data.room,
      note: parsed.data.note,
    })
    .eq("id", parsed.data.id);

  if (error) {
    logSupabaseActionError("updateScheduleSlot", error, { ...parsed.data, class_id: classRow.id }, profile);
    redirect(
      `/egitim-planlama/ders-programi/${classRow.id}?error=${
        error?.code === "23505" ? "duplicate-slot" : mapSupabaseErrorToEducationMessage(error)
      }`,
    );
  }

  await createAuditLog({
    ...buildAuditActor(profile),
    action: "schedule_slot_updated",
    title: "Ders programı slotu güncellendi",
    description: `${classRow.name} için ders programı slotu güncellendi.`,
    entityType: "weekly_schedule_slot",
    entityId: parsed.data.id,
    studentId: null,
    beforeData: null,
    afterData: {
      class_id: classRow.id,
      class_course_id: parsed.data.class_course_id,
      day_of_week: parsed.data.day_of_week,
      period_no: parsed.data.period_no,
      start_time: parsed.data.start_time,
      end_time: parsed.data.end_time,
      room: parsed.data.room,
      note: parsed.data.note,
    },
    metadata: {
      class_id: classRow.id,
    },
  });

  revalidatePath("/egitim-planlama");
  revalidatePath(`/egitim-planlama/ders-programi/${classRow.id}`);
  redirect(`/egitim-planlama/ders-programi/${classRow.id}?saved=1`);
}
