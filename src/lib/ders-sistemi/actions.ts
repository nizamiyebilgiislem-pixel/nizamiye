"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAuth } from "@/lib/auth";
import { buildAuditActor, createAuditLog } from "@/lib/audit/log";
import { canManageDepartmentCourses } from "@/lib/courses/permissions";
import { ensureDefaultExamTypesForCourses } from "@/lib/grades/default-exam-types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const createCourseWithAssignmentsSchema = z.object({
  name: z.string().trim().min(2, "Ders adı zorunludur."),
  department_id: z.string().uuid("Bölüm seçilmelidir."),
  class_ids: z.array(z.string().uuid()).default([]),
  teacher_ids: z.record(z.string(), z.string().uuid().nullable()).default({}),
});

export async function createDersSistemiAction(formData: FormData) {
  const { profile } = await requireAuth();

  const raw = Object.fromEntries(formData);
  const classIdsRaw = String(raw.class_ids ?? "");
  const classIds = classIdsRaw ? classIdsRaw.split(",").filter(Boolean) : [];

  const teacherIdsRaw: Record<string, string | null> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("teacher_")) {
      const classId = key.replace("teacher_", "");
      teacherIdsRaw[classId] = String(value) || null;
    }
  }

  const parsed = createCourseWithAssignmentsSchema.safeParse({
    name: raw.name,
    department_id: raw.department_id,
    class_ids: classIds,
    teacher_ids: teacherIdsRaw,
  });

  if (!parsed.success) {
    redirect(`/ders-sistemi/yeni?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Form hatalı.")}`);
  }

  const departmentId =
    profile.role === "bolum_muduru" ? profile.department_id : parsed.data.department_id;
  if (!departmentId) redirect("/ders-sistemi/yeni?error=unauthorized");
  if (profile.role === "bolum_muduru" && departmentId !== profile.department_id) {
    redirect("/ders-sistemi/yeni?error=unauthorized");
  }

  if (!canManageDepartmentCourses(profile, departmentId)) {
    redirect("/ders-sistemi/yeni?error=unauthorized");
  }

  const slug = parsed.data.name
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replaceAll("ı", "i")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const supabase = await createSupabaseServerClient();

  const { data: existing } = await supabase
    .from("courses")
    .select("id")
    .eq("department_id", departmentId)
    .eq("slug", slug)
    .maybeSingle();

  if (existing) {
    redirect("/ders-sistemi/yeni?error=duplicate");
  }

  const { data: course, error: courseError } = await supabase
    .from("courses")
    .insert({ department_id: departmentId, name: parsed.data.name, slug, is_active: true })
    .select("id")
    .single();

  if (courseError || !course) {
    redirect("/ders-sistemi/yeni?error=save");
  }

  await ensureDefaultExamTypesForCourses([course.id]);

  if (parsed.data.class_ids.length > 0) {
    const inserts = parsed.data.class_ids.map((classId) => ({
      class_id: classId,
      course_id: course.id,
      teacher_id: parsed.data.teacher_ids[classId] ?? null,
      is_active: true,
    }));

    const { error: assignError } = await supabase.from("class_courses").insert(inserts);

    if (assignError) {
      await supabase.from("courses").delete().eq("id", course.id);
      redirect("/ders-sistemi/yeni?error=save");
    }
  }

  await createAuditLog({
    ...buildAuditActor(profile),
    action: "course_created",
    title: "Ders oluşturuldu",
    description: `${parsed.data.name} dersi oluşturuldu ve ${parsed.data.class_ids.length} sınıfa atandı.`,
    entityType: "course",
    entityId: course.id,
    afterData: {
      department_id: departmentId,
      name: parsed.data.name,
      slug,
      class_assignments: parsed.data.class_ids,
    },
  });

  revalidatePath("/ders-sistemi");
  revalidatePath("/not-sistemi/dersler");
  revalidatePath("/egitim-planlama");
  redirect("/ders-sistemi?success=created");
}

const updateCourseSchema = z.object({
  name: z.string().trim().min(2, "Ders adı zorunludur.").optional(),
  is_active: z.coerce.boolean().optional(),
});

export async function toggleClassCourseAction(formData: FormData) {
  const { profile } = await requireAuth();

  const classCourseId = String(formData.get("class_course_id") ?? "");
  const action = String(formData.get("action") ?? "");

  if (!classCourseId || !["activate", "deactivate", "delete"].includes(action)) {
    redirect("/ders-sistemi?error=invalid");
  }

  const supabase = await createSupabaseServerClient();

  const { data: classCourse, error: fetchError } = await supabase
    .from("class_courses")
    .select("*")
    .eq("id", classCourseId)
    .single();

  if (fetchError || !classCourse) {
    redirect("/ders-sistemi?error=notfound");
  }

  const { data: course } = await supabase
    .from("courses")
    .select("department_id")
    .eq("id", classCourse.course_id)
    .single();

  if (!course) {
    redirect("/ders-sistemi?error=notfound");
  }

  if (!canManageDepartmentCourses(profile, course.department_id)) {
    redirect("/ders-sistemi?error=unauthorized");
  }

  if (action === "delete") {
    const { error: deleteError } = await supabase
      .from("class_courses")
      .delete()
      .eq("id", classCourseId);

    if (deleteError) {
      redirect("/ders-sistemi?error=delete");
    }
  } else {
    const isActive = action === "activate";
    const { error: updateError } = await supabase
      .from("class_courses")
      .update({ is_active: isActive })
      .eq("id", classCourseId);

    if (updateError) {
      redirect("/ders-sistemi?error=update");
    }
  }

  await createAuditLog({
    ...buildAuditActor(profile),
    action: `class_course_${action}`,
    title: "Sınıf ders ataması güncellendi",
    entityType: "class_course",
    entityId: classCourseId,
    afterData: { action, class_course_id: classCourseId },
  });

  revalidatePath("/ders-sistemi");
  revalidatePath("/egitim-planlama");
  redirect("/ders-sistemi?success=updated");
}

export async function updateDersSistemiAction(formData: FormData) {
  const { profile } = await requireAuth();

  const courseId = String(formData.get("course_id") ?? "");
  if (!courseId) redirect("/ders-sistemi?error=invalid");

  const supabase = await createSupabaseServerClient();

  const { data: course, error: fetchError } = await supabase
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .single();

  if (fetchError || !course) redirect("/ders-sistemi?error=notfound");

  if (!canManageDepartmentCourses(profile, course.department_id)) {
    redirect("/ders-sistemi?error=unauthorized");
  }

  const parsed = updateCourseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(`/ders-sistemi/${courseId}/duzenle?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Form hatalı.")}`);
  }

  if (parsed.data.name !== undefined && parsed.data.name !== course.name) {
    const slug = parsed.data.name
      .trim()
      .toLocaleLowerCase("tr-TR")
      .replaceAll("ı", "i")
      .replaceAll("ğ", "g")
      .replaceAll("ü", "u")
      .replaceAll("ş", "s")
      .replaceAll("ö", "o")
      .replaceAll("ç", "c")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const { data: existing } = await supabase
      .from("courses")
      .select("id")
      .eq("department_id", course.department_id)
      .eq("slug", slug)
      .neq("id", courseId)
      .maybeSingle();

    if (existing) redirect(`/ders-sistemi/${courseId}/duzenle?error=duplicate`);

    const { error: nameError } = await supabase
      .from("courses")
      .update({ name: parsed.data.name, slug })
      .eq("id", courseId);

    if (nameError) redirect(`/ders-sistemi/${courseId}/duzenle?error=update`);
  }

  if (parsed.data.is_active !== undefined) {
    const { error: activeError } = await supabase
      .from("courses")
      .update({ is_active: parsed.data.is_active })
      .eq("id", courseId);

    if (activeError) redirect(`/ders-sistemi/${courseId}/duzenle?error=update`);
  }

  const classIdsRaw = String(formData.get("class_ids") ?? "");
  const newClassIds = classIdsRaw ? classIdsRaw.split(",").filter(Boolean) : [];

  if (newClassIds.length > 0) {
    const inserts = newClassIds.map((classId) => {
      const teacherId = String(formData.get(`teacher_${classId}`) ?? "").trim() || null;
      return {
        class_id: classId,
        course_id: courseId,
        teacher_id: teacherId,
        is_active: true,
      };
    });

    const { error: assignError } = await supabase.from("class_courses").insert(inserts);
    if (assignError) redirect(`/ders-sistemi/${courseId}/duzenle?error=save`);
  }

  await createAuditLog({
    ...buildAuditActor(profile),
    action: "course_updated",
    title: "Ders güncellendi",
    entityType: "course",
    entityId: courseId,
  });

  revalidatePath("/ders-sistemi");
  revalidatePath("/ders-sistemi/[id]/duzenle");
  revalidatePath("/egitim-planlama");
  redirect("/ders-sistemi?success=updated");
}
