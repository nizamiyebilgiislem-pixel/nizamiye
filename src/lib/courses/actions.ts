"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAuth } from "@/lib/auth";
import { getCourseById } from "@/lib/courses/queries";
import { canManageGradeSettings } from "@/lib/grades/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
  redirect("/not-sistemi/dersler");
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
  redirect("/not-sistemi/dersler");
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
