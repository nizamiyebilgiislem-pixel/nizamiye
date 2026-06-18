"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAuth } from "@/lib/auth";
import { buildAuditActor, createAuditLog } from "@/lib/audit/log";
import { normalizeTurkishPhone } from "@/lib/phone";
import { generateStrongTemporaryPassword } from "@/lib/profiles/password-reset";
import { setPasswordResetFlash } from "@/lib/profiles/password-reset-flash";
import {
  createAuthUserAccount,
  deleteAuthUserAccount,
  findAuthUserByEmail,
  updateAuthUserPassword,
} from "@/lib/profiles/auth-accounts";
import {
  canAssignRole,
  canEditStaffProfile,
  canManageUserProfile,
} from "@/lib/profiles/permissions";
import { getProfileById } from "@/lib/profiles/queries";
import { uploadProfilePhoto, validateImageFile } from "@/lib/storage/upload";
import { SupabaseAdminConfigError } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/rbac";

const emptyToNull = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}, z.string().nullable());

const emailField = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim().toLocaleLowerCase("en-US");
  return trimmed.length === 0 ? null : trimmed;
}, z.string().email("E-posta formatı hatalı.").nullable());

const passwordField = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}, z.string().min(8, "Geçici şifre en az 8 karakter olmalıdır.").nullable());

const booleanField = z.preprocess((value) => value === "on" || value === "true", z.boolean());

const roleSchema = z.enum(["admin", "genel_mudur", "bolum_muduru", "hoca", "veli"]);
const sourceSchema = z.enum(["hocalar", "kullanicilar", "veliler"]);

const profileSchema = z
  .object({
    full_name: z.string().trim().min(2, "Ad soyad zorunludur."),
    email: emailField,
    phone: emptyToNull,
    role: roleSchema,
    department_id: emptyToNull,
    is_active: z.enum(["true", "false"]).default("true"),
  })
  .superRefine((data, context) => {
    if ((data.role === "hoca" || data.role === "bolum_muduru") && !data.department_id) {
      context.addIssue({
        code: "custom",
        message: "Hoca ve bölüm müdürü için bölüm seçilmelidir.",
        path: ["department_id"],
      });
    }
  });

const createStaffProfileSchema = profileSchema.extend({
  create_auth: booleanField.default(false),
  temporary_password: passwordField,
}).superRefine((data, context) => {
  if (!data.create_auth) {
    return;
  }

  if (!data.email) {
    context.addIssue({
      code: "custom",
      message: "Auth hesabı oluşturmak için e-posta zorunludur.",
      path: ["email"],
    });
  }

  if (!data.temporary_password) {
    context.addIssue({
      code: "custom",
      message: "Auth hesabı oluşturmak için geçici şifre girin.",
      path: ["temporary_password"],
    });
  }
});

const updateProfileSchema = profileSchema.extend({
  id: z.string().uuid(),
});

const profileAuthSchema = z.object({
  profile_id: z.string().uuid(),
  source: sourceSchema,
  email: z.string().trim().email("Geçerli bir e-posta girin.").transform((value) => value.toLocaleLowerCase("en-US")),
  temporary_password: z.string().trim().min(8, "Geçici şifre en az 8 karakter olmalıdır."),
});

const resetPasswordSchema = z.object({
  profile_id: z.string().uuid(),
  source: sourceSchema,
  return_path: z.string().trim().min(1).optional(),
  password_mode: z.enum(["manual", "generated"]).default("manual"),
  temporary_password: z.string().trim().optional(),
}).superRefine((data, context) => {
  if (data.password_mode === "manual" && (!data.temporary_password || data.temporary_password.trim().length < 8)) {
    context.addIssue({
      code: "custom",
      message: "Yeni şifre en az 8 karakter olmalıdır.",
      path: ["temporary_password"],
    });
  }
});

async function createProfileAction(formData: FormData, source: "hocalar" | "kullanicilar") {
  const { profile } = await requireAuth();
  const parsed = createStaffProfileSchema.safeParse(Object.fromEntries(formData));

  const yeniPath = `/${source}/yeni`;
  const detailPath = (id: string) => `/${source}/${id}`;

  if (!parsed.success) {
    redirect(`${yeniPath}?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Form bilgileri hatalı.")}`);
  }

  if (!canAssignRole(profile, parsed.data.role)) {
    redirect(`${yeniPath}?error=unauthorized`);
  }

  if (profile.role === "bolum_muduru") {
    if (parsed.data.role !== "hoca") {
      redirect(`${yeniPath}?error=unauthorized`);
    }
    if (!profile.department_id) {
      redirect(`${yeniPath}?error=department-missing`);
    }
    if (parsed.data.department_id !== profile.department_id) {
      redirect(`${yeniPath}?error=department-forbidden`);
    }
  }

  const supabase = await createSupabaseServerClient();
  const { data: existing } = parsed.data.email
    ? await supabase.from("profiles").select("id").eq("email", parsed.data.email).maybeSingle()
    : { data: null };

  if (existing) {
    redirect(`${yeniPath}?error=email`);
  }

  const photoFile = getPhotoFile(formData);
  if (photoFile) {
    validateProfilePhoto(photoFile, yeniPath);
  }

  let authUserId: string | null = null;

  if (parsed.data.create_auth && parsed.data.email && parsed.data.temporary_password) {
    const existingAuthUser = await findAuthUserByEmail(parsed.data.email);

    if (existingAuthUser) {
      redirect(`${yeniPath}?error=auth-email`);
    }

    const { user, error } = await createAuthUserAccount({
      email: parsed.data.email,
      password: parsed.data.temporary_password,
      fullName: parsed.data.full_name,
      phone: parsed.data.phone,
    });

    if (error || !user) {
      redirect(`${yeniPath}?error=auth-create`);
    }

    authUserId = user.id;
  }

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      auth_user_id: authUserId,
      full_name: parsed.data.full_name,
      email: parsed.data.email,
      phone: normalizeTurkishPhone(parsed.data.phone) ?? null,
      role: parsed.data.role,
      department_id: normalizeDepartmentId(parsed.data.role, parsed.data.department_id),
      is_active: parsed.data.is_active === "true",
    })
    .select("id")
    .single();

  if (error || !data) {
    if (authUserId) {
      await deleteAuthUserAccount(authUserId);
      redirect(`${yeniPath}?error=auth-rollback`);
    }

    redirect(`${yeniPath}?error=save`);
  }

  if (photoFile) {
    const uploaded = await uploadProfilePhoto(data.id, photoFile).catch(() => {
      redirect(`${detailPath(data.id)}/duzenle?error=photo-upload`);
    });

    if (uploaded) {
      await supabase.from("profiles").update({ photo_url: uploaded.publicUrl }).eq("id", data.id);
    }
  }

  await createAuditLog({
    ...buildAuditActor(profile),
    action: "staff_profile_created",
    title: parsed.data.role === "hoca" ? "Hoca oluşturuldu" : "Kullanıcı oluşturuldu",
    description: `${parsed.data.full_name} profili oluşturuldu.`,
    entityType: "staff_profile",
    entityId: data.id,
    beforeData: null,
    afterData: {
      id: data.id,
      full_name: parsed.data.full_name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      role: parsed.data.role,
      department_id: normalizeDepartmentId(parsed.data.role, parsed.data.department_id),
      is_active: parsed.data.is_active === "true",
      auth_user_id: authUserId,
    },
    metadata: {
      source,
    },
  });

  if (authUserId) {
    await createAuditLog({
      ...buildAuditActor(profile),
      action: "auth_account_created",
      title: "Auth hesabı oluşturuldu",
      description: `${parsed.data.full_name} için Supabase Auth hesabı oluşturuldu.`,
      entityType: "auth_account",
      entityId: authUserId,
      beforeData: null,
      afterData: {
        profile_id: data.id,
        email: parsed.data.email,
      },
      metadata: {
        profile_id: data.id,
      },
    });
  }

  revalidatePath("/hocalar");
  revalidatePath("/kullanicilar");
  redirect(`${detailPath(data.id)}${authUserId ? "?success=auth-created" : "?success=created"}`);
}

export async function createStaffProfileAction(formData: FormData) {
  return createProfileAction(formData, "hocalar");
}

export async function createUserProfileAction(formData: FormData) {
  return createProfileAction(formData, "kullanicilar");
}

export async function updateStaffProfileAction(formData: FormData) {
  const { profile } = await requireAuth();
  const parsed = updateProfileSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    const fallbackId = String(formData.get("id") ?? "");
    redirect(`/hocalar/${fallbackId}/duzenle?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Form bilgileri hatalı.")}`);
  }

  const target = await getProfileById(parsed.data.id);

  if (!target) {
    redirect("/hocalar?error=not-found");
  }

  if (!canEditStaffProfile(profile, target)) {
    redirect(`/hocalar/${target.id}?error=unauthorized`);
  }

  if (!canAssignRole(profile, parsed.data.role) && profile.role !== "admin") {
    redirect(`/hocalar/${target.id}/duzenle?error=unauthorized`);
  }

  if (profile.role === "bolum_muduru") {
    if (parsed.data.department_id && parsed.data.department_id !== profile.department_id) {
      redirect(`/hocalar/${target.id}/duzenle?error=department-forbidden`);
    }
  }

  const photoFile = getPhotoFile(formData);
  if (photoFile) {
    validateProfilePhoto(photoFile, `/hocalar/${target.id}/duzenle`);
  }

  await persistProfileUpdate(parsed.data, target.id, "/hocalar", photoFile);

  revalidatePath("/hocalar");
  revalidatePath("/kullanicilar");
  revalidatePath(`/hocalar/${target.id}`);
  redirect(`/hocalar/${target.id}?success=updated`);
}

export async function updateUserProfileAction(formData: FormData) {
  const { profile } = await requireAuth();
  const parsed = updateProfileSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    const fallbackId = String(formData.get("id") ?? "");
    redirect(`/kullanicilar/${fallbackId}?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Form bilgileri hatalı.")}`);
  }

  const target = await getProfileById(parsed.data.id);

  if (!target) {
    redirect("/kullanicilar?error=not-found");
  }

  if (!canManageUserProfile(profile, target)) {
    redirect(`/kullanicilar/${target.id}?error=unauthorized`);
  }

  const photoFile = getPhotoFile(formData);
  if (photoFile) {
    validateProfilePhoto(photoFile, `/kullanicilar/${target.id}`);
  }

  await persistProfileUpdate(parsed.data, target.id, "/kullanicilar", photoFile);

  revalidatePath("/hocalar");
  revalidatePath("/kullanicilar");
  revalidatePath(`/kullanicilar/${target.id}`);
  redirect(`/kullanicilar/${target.id}?success=updated`);
}

export async function deleteUserProfileAction(formData: FormData) {
  const { profile } = await requireAuth();
  const id = formData.get("id");

  if (typeof id !== "string" || !id) {
    redirect("/kullanicilar?error=missing-id");
  }

  const target = await getProfileById(id);

  if (!target) {
    redirect("/kullanicilar?error=not-found");
  }

  if (!canManageUserProfile(profile, target)) {
    redirect(`/kullanicilar/${target.id}?error=unauthorized`);
  }

  const supabase = await createSupabaseServerClient();

  if (target.auth_user_id) {
    await deleteAuthUserAccount(target.auth_user_id);
  }

  const { error } = await supabase.from("profiles").delete().eq("id", target.id);

  if (error) {
    redirect("/kullanicilar?error=delete-failed");
  }

  await createAuditLog({
    ...buildAuditActor(profile),
    action: "staff_profile_deleted",
    title: "Kullanıcı silindi",
    description: `${target.full_name} profili silindi.`,
    entityType: "staff_profile",
    entityId: target.id,
    beforeData: {
      full_name: target.full_name,
      email: target.email,
      role: target.role,
    },
    afterData: null,
    metadata: {
      source: "kullanicilar",
    },
  });

  revalidatePath("/hocalar");
  revalidatePath("/kullanicilar");
  redirect("/kullanicilar?success=deleted");
}

export async function createProfileAuthAccountAction(formData: FormData) {
  const { profile } = await requireAuth();
  const parsed = profileAuthSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirect(`${getProfileBasePath(String(formData.get("source") ?? "hocalar"))}/${String(formData.get("profile_id") ?? "")}?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Form bilgileri hatalı.")}`);
  }

  const target = await getProfileById(parsed.data.profile_id);

  if (!target) {
    redirect("/kullanicilar?error=not-found");
  }

  if (!canManageUserProfile(profile, target) && !canEditStaffProfile(profile, target)) {
    redirect(`${getProfileBasePath(parsed.data.source)}/${target.id}?error=unauthorized`);
  }

  if (target.auth_user_id) {
    redirect(`${getProfileBasePath(parsed.data.source)}/${target.id}?error=auth-exists`);
  }

  const supabase = await createSupabaseServerClient();
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", parsed.data.email)
    .neq("id", target.id)
    .maybeSingle();

  if (existingProfile) {
    redirect(`${getProfileBasePath(parsed.data.source)}/${target.id}?error=email`);
  }

  const existingAuthUser = await findAuthUserByEmail(parsed.data.email);

  if (existingAuthUser) {
    redirect(`${getProfileBasePath(parsed.data.source)}/${target.id}?error=auth-email`);
  }

  const { user, error: authError } = await createAuthUserAccount({
    email: parsed.data.email,
    password: parsed.data.temporary_password,
    fullName: target.full_name,
    phone: target.phone,
  });

  if (authError || !user) {
    redirect(`${getProfileBasePath(parsed.data.source)}/${target.id}?error=auth-create`);
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      auth_user_id: user.id,
      email: parsed.data.email,
    })
    .eq("id", target.id);

  if (updateError) {
    await deleteAuthUserAccount(user.id);
    redirect(`${getProfileBasePath(parsed.data.source)}/${target.id}?error=auth-rollback`);
  }

  await createAuditLog({
    ...buildAuditActor(profile),
    action: "auth_account_created",
    title: "Auth hesabı oluşturuldu",
    description: `${target.full_name} profiline Supabase Auth hesabı bağlandı.`,
    entityType: "auth_account",
    entityId: user.id,
    beforeData: target.auth_user_id ? { auth_user_id: target.auth_user_id } : null,
    afterData: {
      profile_id: target.id,
      auth_user_id: user.id,
      email: parsed.data.email,
    },
    metadata: {
      profile_id: target.id,
      source: parsed.data.source,
    },
  });

  revalidatePath("/hocalar");
  revalidatePath("/kullanicilar");
  revalidatePath(`${getProfileBasePath(parsed.data.source)}/${target.id}`);
  redirect(`${getProfileBasePath(parsed.data.source)}/${target.id}?success=auth-linked`);
}

export async function resetProfileAuthPasswordAction(formData: FormData) {
  const { profile } = await requireAuth();
  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirect(`${getProfileBasePath(String(formData.get("source") ?? "hocalar"))}/${String(formData.get("profile_id") ?? "")}?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Form bilgileri hatalı.")}`);
  }

  const target = await getProfileById(parsed.data.profile_id);

  if (!target) {
    redirect("/kullanicilar?error=not-found");
  }

  if (!canManageUserProfile(profile, target) && !canEditStaffProfile(profile, target)) {
    redirect(`${getProfileBasePath(parsed.data.source)}/${target.id}?error=unauthorized`);
  }

  if (profile.id === target.id) {
    redirect(`${resolveReturnPath(parsed.data.source, target.id, parsed.data.return_path)}?error=self-password-reset`);
  }

  if (!target.auth_user_id) {
    redirect(`${resolveReturnPath(parsed.data.source, target.id, parsed.data.return_path)}?error=auth-missing`);
  }

  const nextPassword = parsed.data.password_mode === "generated"
    ? generateStrongTemporaryPassword()
    : parsed.data.temporary_password!.trim();

  try {
    const { error } = await updateAuthUserPassword(target.auth_user_id, nextPassword);

    if (error) {
      redirect(`${resolveReturnPath(parsed.data.source, target.id, parsed.data.return_path)}?error=auth-password`);
    }
  } catch (error) {
    if (error instanceof SupabaseAdminConfigError) {
      redirect(`${resolveReturnPath(parsed.data.source, target.id, parsed.data.return_path)}?error=server-config`);
    }

    redirect(`${resolveReturnPath(parsed.data.source, target.id, parsed.data.return_path)}?error=auth-password`);
  }

  await createAuditLog({
    ...buildAuditActor(profile),
    action: "password_reset_by_admin",
    title: "Şifre yönetici tarafından sıfırlandı",
    description: `${target.full_name} için giriş şifresi yönetici tarafından sıfırlandı.`,
    entityType: "auth_account",
    entityId: target.auth_user_id,
    beforeData: null,
    afterData: {
      profile_id: target.id,
      auth_user_id: target.auth_user_id,
    },
    metadata: {
      profile_id: target.id,
      target_user_id: target.auth_user_id,
      performed_by: profile.id,
      source: parsed.data.source,
    },
  });

  if (parsed.data.password_mode === "generated") {
    await setPasswordResetFlash({
      source: parsed.data.source,
      profileId: target.id,
      password: nextPassword,
    });
  }

  revalidatePath("/hocalar");
  revalidatePath("/kullanicilar");
  revalidatePath("/veliler");
  revalidatePath(`${getProfileBasePath(parsed.data.source)}/${target.id}`);
  revalidatePath(`${getProfileBasePath(parsed.data.source)}/${target.id}/duzenle`);
  redirect(`${resolveReturnPath(parsed.data.source, target.id, parsed.data.return_path)}?success=password-reset`);
}

async function persistProfileUpdate(
  data: z.infer<typeof updateProfileSchema>,
  targetId: string,
  fallbackPath: "/hocalar" | "/kullanicilar",
  photoFile: File | null,
) {
  const supabase = await createSupabaseServerClient();
  const { data: existing } = data.email
    ? await supabase.from("profiles").select("id").eq("email", data.email).neq("id", targetId).maybeSingle()
    : { data: null };

  if (existing) {
    redirect(`${fallbackPath}/${targetId}/duzenle?error=email`);
  }

  const isActive = data.is_active === "true";

  if (!isActive) {
    await supabase.from("classes").update({ class_teacher_id: null }).eq("class_teacher_id", targetId);
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: data.full_name,
      email: data.email,
      phone: normalizeTurkishPhone(data.phone) ?? null,
      role: data.role,
      department_id: normalizeDepartmentId(data.role, data.department_id),
      is_active: isActive,
    })
    .eq("id", targetId);

  if (error) {
    redirect(`${fallbackPath}/${targetId}/duzenle?error=save`);
  }

  if (photoFile) {
    validateProfilePhoto(photoFile, `${fallbackPath}/${targetId}/duzenle`);
    const uploaded = await uploadProfilePhoto(targetId, photoFile).catch(() => {
      redirect(`${fallbackPath}/${targetId}/duzenle?error=photo-upload`);
    });

    if (uploaded) {
      await supabase.from("profiles").update({ photo_url: uploaded.publicUrl }).eq("id", targetId);
    }
  }
}

function getProfileBasePath(source: string) {
  if (source === "veliler") {
    return "/veliler";
  }

  return source === "kullanicilar" ? "/kullanicilar" : "/hocalar";
}

function resolveReturnPath(source: string, profileId: string, returnPath?: string) {
  if (typeof returnPath === "string" && returnPath.startsWith("/")) {
    return returnPath;
  }

  return `${getProfileBasePath(source)}/${profileId}`;
}

function normalizeDepartmentId(role: UserRole, departmentId: string | null) {
  return role === "hoca" || role === "bolum_muduru" ? departmentId : null;
}

function getPhotoFile(formData: FormData) {
  const value = formData.get("photo");
  return value instanceof File && value.size > 0 ? value : null;
}

function validateProfilePhoto(file: File, path: string) {
  try {
    validateImageFile(file);
  } catch {
    redirect(`${path}?error=photo`);
  }
}
