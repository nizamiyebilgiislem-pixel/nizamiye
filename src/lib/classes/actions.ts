"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAuth } from "@/lib/auth";
import { canEditClass, canManageClasses } from "@/lib/classes/permissions";
import { getClassById } from "@/lib/classes/queries";
import { buildSaveRedirect, logSupabaseActionError, buildFriendlyDbErrorMessage } from "@/lib/supabase-action-error";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const emptyUuidToNull = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  return value.trim() === "" ? null : value.trim();
}, z.string().uuid().nullable());

const createClassSchema = z.object({
  department_id: z.string().uuid("Bölüm seçilmelidir."),
  name: z.string().trim().min(2, "Sınıf adı zorunludur."),
  class_teacher_id: emptyUuidToNull,
  is_active: z.enum(["true", "false"]).default("true"),
});

const updateClassSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(2, "Sınıf adı zorunludur."),
  class_teacher_id: emptyUuidToNull,
  is_active: z.enum(["true", "false"]).default("true"),
});

export async function createClassAction(formData: FormData) {
  const { profile } = await requireAuth();

  if (!canManageClasses(profile)) {
    redirect("/siniflar?error=unauthorized");
  }

  const parsed = createClassSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirect(`/siniflar/yeni?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Form bilgileri hatalı.")}`);
  }

  const departmentId = profile.role === "bolum_muduru" ? profile.department_id : parsed.data.department_id;

  if (!departmentId) {
    redirect("/siniflar/yeni?error=department");
  }

  if (profile.role === "bolum_muduru" && departmentId !== profile.department_id) {
    redirect("/siniflar/yeni?error=unauthorized");
  }

  if (parsed.data.class_teacher_id) {
    const teacherMatchesDepartment = await isTeacherInDepartment(parsed.data.class_teacher_id, departmentId);

    if (!teacherMatchesDepartment) {
      redirect("/siniflar/yeni?error=teacher");
    }
  }

  const slug = slugifyClassName(parsed.data.name);
  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase
    .from("classes")
    .select("id")
    .eq("department_id", departmentId)
    .eq("slug", slug)
    .maybeSingle();

  if (existing) {
    redirect("/siniflar/yeni?error=duplicate&errorMessage=" + encodeURIComponent("Bu bölümde aynı isimde bir sınıf zaten var."));
  }

  const payload = {
    department_id: departmentId,
    name: parsed.data.name,
    slug,
    class_teacher_id: parsed.data.class_teacher_id,
    is_active: parsed.data.is_active === "true",
  };

  const { data, error } = await supabase
    .from("classes")
    .insert(payload)
    .select("id")
    .single();

  if (error || !data) {
    logSupabaseActionError({
      action: "createClassAction",
      profile: { id: profile.id, role: profile.role },
      payload,
      error: error ?? null,
    });
    redirect(buildSaveRedirect("/siniflar/yeni", error));
  }

  revalidatePath("/siniflar");
  redirect("/siniflar?success=created");
}

export async function updateClassAction(formData: FormData) {
  const { profile } = await requireAuth();
  const parsed = updateClassSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    const fallbackId = String(formData.get("id") ?? "");
    redirect(`/siniflar/${fallbackId}/duzenle?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Form bilgileri hatalı.")}`);
  }

  const classRow = await getClassById(parsed.data.id);

  if (!classRow) {
    redirect("/siniflar?error=not-found");
  }

  if (!canEditClass(profile, classRow)) {
    redirect(`/siniflar/${parsed.data.id}?error=unauthorized`);
  }

  if (parsed.data.class_teacher_id) {
    const teacherMatchesDepartment = await isTeacherInDepartment(parsed.data.class_teacher_id, classRow.department_id);

    if (!teacherMatchesDepartment) {
      redirect(`/siniflar/${parsed.data.id}/duzenle?error=teacher`);
    }
  }

  const slug = slugifyClassName(parsed.data.name);
  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase
    .from("classes")
    .select("id")
    .eq("department_id", classRow.department_id)
    .eq("slug", slug)
    .neq("id", parsed.data.id)
    .maybeSingle();

  if (existing) {
    redirect(`/siniflar/${parsed.data.id}/duzenle?error=duplicate&errorMessage=` + encodeURIComponent("Bu bölümde aynı isimde bir sınıf zaten var."));
  }

  const payload = {
    name: parsed.data.name,
    slug,
    class_teacher_id: parsed.data.class_teacher_id,
    is_active: parsed.data.is_active === "true",
  };

  const { error } = await supabase
    .from("classes")
    .update(payload)
    .eq("id", parsed.data.id);

  if (error) {
    logSupabaseActionError({
      action: "updateClassAction",
      profile: { id: profile.id, role: profile.role },
      payload: { id: parsed.data.id, ...payload },
      error,
    });
    redirect(buildSaveRedirect(`/siniflar/${parsed.data.id}/duzenle`, error));
  }

  revalidatePath("/siniflar");
  revalidatePath(`/siniflar/${parsed.data.id}`);
  redirect(`/siniflar/${parsed.data.id}?success=updated`);
}

async function isTeacherInDepartment(teacherId: string, departmentId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", teacherId)
    .in("role", ["hoca", "bolum_muduru"])
    .eq("is_active", true)
    .eq("department_id", departmentId)
    .maybeSingle();

  return !error && Boolean(data);
}

export async function deleteClassAction(classId: string) {
  const { profile } = await requireAuth();

  if (!canManageClasses(profile)) {
    return { error: "Bu işlem için yetkiniz bulunmamaktadır." };
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("classes")
    .delete()
    .eq("id", classId);

  if (error) {
    logSupabaseActionError({ action: "deleteClass", profile, payload: { id: classId }, error });
    return { error: buildFriendlyDbErrorMessage(error) };
  }

  revalidatePath("/siniflar");
  return { success: true };
}

function slugifyClassName(value: string) {
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
