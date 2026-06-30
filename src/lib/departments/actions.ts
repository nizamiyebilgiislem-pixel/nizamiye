"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAuth } from "@/lib/auth";
import { slugify } from "@/lib/slug";
import { buildSaveRedirect, logSupabaseActionError, buildFriendlyDbErrorMessage } from "@/lib/supabase-action-error";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { canManageDepartments } from "@/lib/departments/permissions";

const emptyToNull = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}, z.string().nullable());

const departmentSchema = z.object({
  name: z.string().trim().min(2, "Bölüm adı zorunludur."),
  description: emptyToNull,
});

const departmentUpdateSchema = departmentSchema.extend({
  id: z.string().uuid(),
  is_active: z.enum(["true", "false"]),
});

export async function createDepartmentAction(formData: FormData) {
  const { profile } = await requireAuth();

  if (!canManageDepartments(profile)) {
    redirect("/bolumler?error=unauthorized");
  }

  const parsed = departmentSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirect(`/bolumler/yeni?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Form bilgileri hatalı.")}`);
  }

  const slug = slugify(parsed.data.name);

  if (!slug) {
    redirect("/bolumler/yeni?error=slug");
  }

  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase.from("departments").select("id").eq("slug", slug).maybeSingle();

  if (existing) {
    redirect("/bolumler/yeni?error=slug&errorMessage=" + encodeURIComponent("Aynı slug'a sahip başka bir bölüm var. Bölüm adını değiştirin."));
  }

  const payload = {
    name: parsed.data.name,
    slug,
    description: parsed.data.description,
    is_active: true,
  };

  const { data, error } = await supabase
    .from("departments")
    .insert(payload)
    .select("id")
    .single();

  if (error || !data) {
    logSupabaseActionError({
      action: "createDepartmentAction",
      profile: { id: profile.id, role: profile.role },
      payload,
      error: error ?? null,
    });
    redirect(buildSaveRedirect("/bolumler/yeni", error));
  }

  revalidateDepartmentPages();
  redirect(`/bolumler/${data.id}?success=created`);
}

export async function updateDepartmentAction(formData: FormData) {
  const { profile } = await requireAuth();

  if (!canManageDepartments(profile)) {
    redirect("/bolumler?error=unauthorized");
  }

  const parsed = departmentUpdateSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    const fallbackId = String(formData.get("id") ?? "");
    redirect(`/bolumler/${fallbackId}/duzenle?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Form bilgileri hatalı.")}`);
  }

  const slug = slugify(parsed.data.name);

  if (!slug) {
    redirect(`/bolumler/${parsed.data.id}/duzenle?error=slug`);
  }

  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase
    .from("departments")
    .select("id")
    .eq("slug", slug)
    .neq("id", parsed.data.id)
    .maybeSingle();

  if (existing) {
    redirect(`/bolumler/${parsed.data.id}/duzenle?error=slug&errorMessage=` + encodeURIComponent("Aynı slug'a sahip başka bir bölüm var. Bölüm adını değiştirin."));
  }

  const payload = {
    name: parsed.data.name,
    slug,
    description: parsed.data.description,
    is_active: parsed.data.is_active === "true",
  };

  const { error } = await supabase
    .from("departments")
    .update(payload)
    .eq("id", parsed.data.id);

  if (error) {
    logSupabaseActionError({
      action: "updateDepartmentAction",
      profile: { id: profile.id, role: profile.role },
      payload: { id: parsed.data.id, ...payload },
      error,
    });
    redirect(buildSaveRedirect(`/bolumler/${parsed.data.id}/duzenle`, error));
  }

  revalidateDepartmentPages();
  redirect(`/bolumler/${parsed.data.id}?success=updated`);
}

export async function deleteDepartmentAction(departmentId: string) {
  const { profile } = await requireAuth();

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("departments")
    .delete()
    .eq("id", departmentId);

  if (error) {
    logSupabaseActionError({ action: "deleteDepartment", profile, payload: { id: departmentId }, error });
    return { error: buildFriendlyDbErrorMessage(error) };
  }

  revalidateDepartmentPages();
  revalidatePath("/bolumler");
  return { success: true };
}

function revalidateDepartmentPages() {
  const paths = [
    "/bolumler",
    "/dashboard",
    "/siniflar",
    "/talebeler",
    "/talebeler/arsiv",
    "/hocalar",
    "/kullanicilar",
    "/not-sistemi",
    "/not-sistemi/dersler",
    "/kanaat-sistemi",
    "/revir",
    "/duyurular",
    "/evraklar",
    "/raporlar",
  ];

  for (const path of paths) {
    revalidatePath(path);
  }
}
