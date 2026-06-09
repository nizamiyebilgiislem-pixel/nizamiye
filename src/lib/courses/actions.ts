"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAuth } from "@/lib/auth";
import { getCourseById } from "@/lib/courses/queries";
import { canManageDepartmentCourses, canManageClassCourses } from "@/lib/courses/permissions";
import { getEducationClassById } from "@/lib/education/queries";
import { canManageGradeSettings } from "@/lib/grades/permissions";
import { buildAuditActor, createAuditLog } from "@/lib/audit/log";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logSupabaseActionError, buildFriendlyDbErrorMessage } from "@/lib/supabase-action-error";

const courseSchema = z.object({
  department_id: z.string().uuid("Bölüm seçilmelidir."),
  name: z.string().trim().min(2, "Ders adı zorunludur."),
  is_active: z.enum(["true", "false"]).default("true"),
});

const updateCourseSchema = courseSchema.omit({ department_id: true }).extend({
  id: z.string().uuid(),
});

const examTypeSchema = z.object({
  course_id: z.string().uuid(),
  name: z.string().trim().min(2, "Sınav türü adı zorunludur."),
  weight: z.coerce.number().positive("Ağırlık 0'dan büyük olmalıdır."),
  is_active: z.enum(["true", "false"]).default("true"),
});

const updateExamTypeSchema = examTypeSchema.extend({
  id: z.string().uuid(),
});

export async function createCourseAction(formData: FormData) {
  const { profile } = await requireAuth();

  if (!canManageGradeSettings(profile)) redirect("/not-sistemi/dersler?error=unauthorized");

  const parsed = courseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(`/not-sistemi/dersler/yeni?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Form hatalı.")}`);

  const departmentId = profile.role === "bolum_muduru" ? profile.department_id : parsed.data.department_id;
  if (!departmentId) redirect("/not-sistemi/dersler/yeni?error=department");
  if (profile.role === "bolum_muduru" && departmentId !== profile.department_id) redirect("/not-sistemi/dersler/yeni?error=unauthorized");

  const slug = slugify(parsed.data.name);
  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase.from("courses").select("id").eq("department_id", departmentId).eq("slug", slug).maybeSingle();
  if (existing) redirect("/not-sistemi/dersler/yeni?error=duplicate");

  const { error } = await supabase.from("courses").insert({
    department_id: departmentId,
    name: parsed.data.name,
    slug,
    is_active: parsed.data.is_active === "true",
  });

  if (error) redirect("/not-sistemi/dersler/yeni?error=save");
  revalidatePath("/not-sistemi/dersler");
  redirect("/not-sistemi/dersler?success=created");
}

export async function updateCourseAction(formData: FormData) {
  const { profile } = await requireAuth();
  if (!canManageGradeSettings(profile)) redirect("/not-sistemi/dersler?error=unauthorized");

  const parsed = updateCourseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(`/not-sistemi/dersler?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Form hatalı.")}`);

  const course = await getCourseById(parsed.data.id);
  if (!course) redirect("/not-sistemi/dersler?error=not-found");
  if (profile.role === "bolum_muduru" && course.department_id !== profile.department_id) redirect("/not-sistemi/dersler?error=unauthorized");

  const slug = slugify(parsed.data.name);
  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase
    .from("courses")
    .select("id")
    .eq("department_id", course.department_id)
    .eq("slug", slug)
    .neq("id", course.id)
    .maybeSingle();
  if (existing) redirect(`/not-sistemi/dersler/${course.id}/duzenle?error=duplicate`);

  const { error } = await supabase
    .from("courses")
    .update({ name: parsed.data.name, slug, is_active: parsed.data.is_active === "true" })
    .eq("id", course.id);

  if (error) redirect(`/not-sistemi/dersler/${course.id}/duzenle?error=save`);
  revalidatePath("/not-sistemi/dersler");
  redirect("/not-sistemi/dersler?success=updated");
}

export async function createExamTypeAction(formData: FormData) {
  const { profile } = await requireAuth();
  if (!canManageGradeSettings(profile)) redirect("/not-sistemi/dersler?error=unauthorized");

  const parsed = examTypeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/not-sistemi/dersler?error=exam");

  const course = await getCourseById(parsed.data.course_id);
  if (!course) redirect("/not-sistemi/dersler?error=not-found");
  if (profile.role === "bolum_muduru" && course.department_id !== profile.department_id) redirect("/not-sistemi/dersler?error=unauthorized");

  const slug = slugify(parsed.data.name);
  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase.from("exam_types").select("id").eq("course_id", course.id).eq("slug", slug).maybeSingle();
  if (existing) redirect("/not-sistemi/dersler?error=duplicate-exam");

  const { error } = await supabase.from("exam_types").insert({
    course_id: course.id,
    name: parsed.data.name,
    slug,
    weight: parsed.data.weight,
    is_active: parsed.data.is_active === "true",
  });

  if (error) redirect("/not-sistemi/dersler?error=save");
  revalidatePath("/not-sistemi/dersler");
}

export async function updateExamTypeAction(formData: FormData) {
  const { profile } = await requireAuth();
  if (!canManageGradeSettings(profile)) redirect("/not-sistemi/dersler?error=unauthorized");

  const parsed = updateExamTypeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/not-sistemi/dersler?error=exam");

  const course = await getCourseById(parsed.data.course_id);
  if (!course) redirect("/not-sistemi/dersler?error=not-found");
  if (profile.role === "bolum_muduru" && course.department_id !== profile.department_id) redirect("/not-sistemi/dersler?error=unauthorized");

  const slug = slugify(parsed.data.name);
  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase
    .from("exam_types")
    .select("id")
    .eq("course_id", course.id)
    .eq("slug", slug)
    .neq("id", parsed.data.id)
    .maybeSingle();
  if (existing) redirect("/not-sistemi/dersler?error=duplicate-exam");

  const { error } = await supabase
    .from("exam_types")
    .update({ name: parsed.data.name, slug, weight: parsed.data.weight, is_active: parsed.data.is_active === "true" })
    .eq("id", parsed.data.id);

  if (error) redirect("/not-sistemi/dersler?error=save");
  revalidatePath("/not-sistemi/dersler");
}

const createDepartmentCourseSchema = z.object({
  department_id: z.string().uuid("Bölüm seçilmelidir."),
  name: z.string().trim().min(2, "Ders adı zorunludur."),
});

export async function createDepartmentCourseAction(_previousState: unknown, formData: FormData) {
  const { profile } = await requireAuth();

  const raw = Object.fromEntries(formData);
  const parsed = createDepartmentCourseSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues.map((e) => e.message).join(", ") };
  }

  const { department_id, name } = parsed.data;

  if (!canManageDepartmentCourses(profile, department_id)) {
    return { error: "Bu işlem için yetkiniz bulunmamaktadır." };
  }

  const slug = slugify(name);
  const supabase = await createSupabaseServerClient();

  const { data: existing } = await supabase
    .from("courses")
    .select("id")
    .eq("department_id", department_id)
    .eq("slug", slug)
    .maybeSingle();

  if (existing) {
    return { error: "Bu bölümde aynı isimde bir ders zaten mevcut." };
  }

  const { data: course, error } = await supabase
    .from("courses")
    .insert({ department_id, name, slug, is_active: true })
    .select("id")
    .single();

  if (error) {
    logSupabaseActionError({ action: "createDepartmentCourse", profile, payload: parsed.data, error });
    return { error: buildFriendlyDbErrorMessage(error) };
  }

  await createAuditLog({
    ...buildAuditActor(profile),
    action: "course_created",
    entityType: "course",
    entityId: course.id,
    title: "Ders oluşturuldu",
    description: `${name} dersi oluşturuldu.`,
    afterData: { department_id, name, slug },
  });

  revalidatePath(`/bolumler/${department_id}`);
  return { success: true, department_id };
}

const toggleCourseSchema = z.object({
  course_id: z.string().uuid(),
  department_id: z.string().uuid(),
});

export async function toggleCourseActiveAction(formData: FormData) {
  const { profile } = await requireAuth();

  const raw = Object.fromEntries(formData);
  const parsed = toggleCourseSchema.safeParse(raw);

  if (!parsed.success) {
    return;
  }

  const { course_id, department_id } = parsed.data;

  if (!canManageDepartmentCourses(profile, department_id)) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  const { data: course, error: fetchError } = await supabase
    .from("courses")
    .select("id, name, is_active")
    .eq("id", course_id)
    .eq("department_id", department_id)
    .maybeSingle();

  if (fetchError || !course) {
    logSupabaseActionError({ action: "toggleCourseActive", profile, payload: { course_id, department_id }, error: fetchError ?? { message: "not found" } });
    return;
  }

  const newActive = !course.is_active;
  const { error } = await supabase
    .from("courses")
    .update({ is_active: newActive })
    .eq("id", course_id);

  if (error) {
    logSupabaseActionError({ action: "toggleCourseActive", profile, payload: { course_id, department_id }, error });
    return;
  }

  await createAuditLog({
    ...buildAuditActor(profile),
    action: newActive ? "course_activated" : "course_deactivated",
    entityType: "course",
    entityId: course_id,
    title: newActive ? "Ders aktifleştirildi" : "Ders pasifleştirildi",
    description: `${course.name} dersi ${newActive ? "aktifleştirildi" : "pasifleştirildi"}.`,
    beforeData: { is_active: course.is_active },
    afterData: { is_active: newActive },
  });

  revalidatePath(`/bolumler/${department_id}`);
}

const classCourseAssignSchema = z.object({
  class_id: z.string().uuid(),
  course_id: z.string().uuid(),
});

const classCourseToggleSchema = z.object({
  id: z.string().uuid(),
  class_id: z.string().uuid(),
});

export async function assignCourseToClassAction(_previousState: unknown, formData: FormData) {
  const { profile } = await requireAuth();

  const raw = Object.fromEntries(formData);
  const parsed = classCourseAssignSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: "Geçersiz istek." };
  }

  const { class_id, course_id } = parsed.data;

  const classRow = await getEducationClassById(profile, class_id);
  if (!classRow) {
    return { error: "Sınıf bulunamadı." };
  }

  if (!canManageClassCourses(profile, classRow)) {
    return { error: "Bu işlem için yetkiniz bulunmamaktadır." };
  }

  const supabase = await createSupabaseServerClient();

  const { data: existing } = await supabase
    .from("class_courses")
    .select("id")
    .eq("class_id", class_id)
    .eq("course_id", course_id)
    .maybeSingle();

  if (existing) {
    return { error: "Bu ders zaten bu sınıfa atanmış." };
  }

  const { data: inserted, error } = await supabase
    .from("class_courses")
    .insert({ class_id, course_id, is_active: true })
    .select("id")
    .single();

  if (error) {
    logSupabaseActionError({ action: "assignCourseToClass", profile, payload: { class_id, course_id }, error });
    return { error: buildFriendlyDbErrorMessage(error) };
  }

  await createAuditLog({
    ...buildAuditActor(profile),
    action: "class_course_created",
    entityType: "class_course",
    entityId: inserted.id,
    title: "Sınıfa ders atandı",
    description: `${classRow.name} sınıfına ders atandı.`,
    afterData: { class_id, course_id, profile_id: profile.id },
    metadata: { class_id },
  });

  revalidatePath(`/siniflar/${class_id}`);
  revalidatePath("/egitim-planlama");
  return { success: true };
}

export async function toggleClassCourseActiveAction(formData: FormData) {
  const { profile } = await requireAuth();

  const raw = Object.fromEntries(formData);
  const parsed = classCourseToggleSchema.safeParse(raw);

  if (!parsed.success) {
    return;
  }

  const { id, class_id } = parsed.data;

  const classRow = await getEducationClassById(profile, class_id);
  if (!classRow) {
    return;
  }

  if (!canManageClassCourses(profile, classRow)) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  const { data: classCourse, error: fetchError } = await supabase
    .from("class_courses")
    .select("id, is_active, course_id")
    .eq("id", id)
    .eq("class_id", class_id)
    .maybeSingle();

  if (fetchError || !classCourse) {
    logSupabaseActionError({ action: "toggleClassCourseActive", profile, payload: { id, class_id }, error: fetchError ?? { message: "not found" } });
    return;
  }

  const newActive = !classCourse.is_active;
  const { error } = await supabase
    .from("class_courses")
    .update({ is_active: newActive })
    .eq("id", id);

  if (error) {
    logSupabaseActionError({ action: "toggleClassCourseActive", profile, payload: { id, class_id }, error });
    return;
  }

  await createAuditLog({
    ...buildAuditActor(profile),
    action: newActive ? "class_course_activated" : "class_course_deactivated",
    entityType: "class_course",
    entityId: id,
    title: newActive ? "Sınıf dersi aktifleştirildi" : "Sınıf dersi pasifleştirildi",
    description: `${classRow.name} sınıfındaki ders ${newActive ? "aktifleştirildi" : "pasifleştirildi"}.`,
    beforeData: { is_active: classCourse.is_active },
    afterData: { is_active: newActive },
    metadata: { class_id },
  });

  revalidatePath(`/siniflar/${class_id}`);
  revalidatePath("/egitim-planlama");
}

function slugify(value: string) {
  return value
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
}
