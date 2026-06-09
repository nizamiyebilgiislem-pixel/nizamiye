"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAuth } from "@/lib/auth";
import { buildAuditActor, createAuditLog } from "@/lib/audit/log";
import {
  createAuthUserAccount,
  deleteAuthUserAccount,
  findAuthUserByEmail,
} from "@/lib/profiles/auth-accounts";
import { uploadProfilePhoto, validateImageFile } from "@/lib/storage/upload";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parentRelations } from "@/lib/parents/constants";
import {
  canBindParentFromStudentDetail,
  canCreateParentProfile,
  canEditParentProfile,
  canManageParentLinks,
} from "@/lib/parents/permissions";
import {
  getParentProfileByIdForProfile,
  getVisibleStudentsForParentManagement,
} from "@/lib/parents/queries";

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
const relationSchema = z.enum(parentRelations);

const parentCreateSchema = z
  .object({
    full_name: z.string().trim().min(2, "Ad soyad zorunludur."),
    email: emailField,
    phone: emptyToNull,
    is_active: z.enum(["true", "false"]).default("true"),
    create_auth: booleanField.default(false),
    temporary_password: passwordField,
    relation: relationSchema,
  })
  .superRefine((data, context) => {
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

const parentUpdateSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().trim().min(2, "Ad soyad zorunludur."),
  email: emailField,
  phone: emptyToNull,
  is_active: z.enum(["true", "false"]).default("true"),
});

const parentLinkSchema = z.object({
  parent_profile_id: z.string().uuid(),
  student_id: z.string().uuid(),
  relation: relationSchema,
});

export async function createParentProfileAction(formData: FormData) {
  const { profile } = await requireAuth();

  if (!canCreateParentProfile(profile)) {
    redirect("/veliler?error=unauthorized");
  }

  const parsed = parentCreateSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirect(`/veliler/yeni?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Form bilgileri hatalı.")}`);
  }

  const selectedStudentIds = formData
    .getAll("student_ids")
    .map((value) => String(value))
    .filter(Boolean);

  if (selectedStudentIds.length === 0) {
    redirect("/veliler/yeni?error=student-required");
  }

  const visibleStudents = await getVisibleStudentsForParentManagement(profile);
  const visibleStudentIdSet = new Set(visibleStudents.map((student) => student.id));

  if (selectedStudentIds.some((studentId) => !visibleStudentIdSet.has(studentId))) {
    redirect("/veliler/yeni?error=unauthorized");
  }

  const supabase = await createSupabaseServerClient();
  const { data: existingProfile } = parsed.data.email
    ? await supabase.from("profiles").select("id").eq("email", parsed.data.email).maybeSingle()
    : { data: null };

  if (existingProfile) {
    redirect("/veliler/yeni?error=email");
  }

  const photoFile = getPhotoFile(formData);
  if (photoFile) {
    validateParentPhoto(photoFile, "/veliler/yeni");
  }

  let authUserId: string | null = null;

  if (parsed.data.create_auth && parsed.data.email && parsed.data.temporary_password) {
    const existingAuthUser = await findAuthUserByEmail(parsed.data.email);

    if (existingAuthUser) {
      redirect("/veliler/yeni?error=auth-email");
    }

    const { user, error } = await createAuthUserAccount({
      email: parsed.data.email,
      password: parsed.data.temporary_password,
      fullName: parsed.data.full_name,
      phone: parsed.data.phone,
    });

    if (error || !user) {
      redirect("/veliler/yeni?error=auth-create");
    }

    authUserId = user.id;
  }

  const { data: createdParent, error: createError } = await supabase
    .from("profiles")
    .insert({
      auth_user_id: authUserId,
      full_name: parsed.data.full_name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      role: "veli",
      is_active: parsed.data.is_active === "true",
    })
    .select("id")
    .single();

  if (createError || !createdParent) {
    if (authUserId) {
      await deleteAuthUserAccount(authUserId);
      redirect("/veliler/yeni?error=auth-rollback");
    }

    redirect("/veliler/yeni?error=save");
  }

  const linkPayload = selectedStudentIds.map((studentId) => ({
    parent_profile_id: createdParent.id,
    student_id: studentId,
    relation: parsed.data.relation,
  }));

  const { error: linkError } = await supabase.from("parent_student_links").insert(linkPayload);

  if (linkError) {
    redirect(`/veliler/${createdParent.id}?error=parent-links`);
  }

  if (photoFile) {
    const uploaded = await uploadProfilePhoto(createdParent.id, photoFile).catch(() => {
      redirect(`/veliler/${createdParent.id}/duzenle?error=photo-upload`);
    });

    if (uploaded) {
      await supabase.from("profiles").update({ photo_url: uploaded.publicUrl }).eq("id", createdParent.id);
    }
  }

  await createAuditLog({
    ...buildAuditActor(profile),
    action: "parent_created",
    title: "Veli oluşturuldu",
    description: `${parsed.data.full_name} profili oluşturuldu.`,
    entityType: "parent",
    entityId: createdParent.id,
    beforeData: null,
    afterData: {
      id: createdParent.id,
      full_name: parsed.data.full_name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      is_active: parsed.data.is_active === "true",
      auth_user_id: authUserId,
    },
    metadata: {
      relation: parsed.data.relation,
      student_ids: selectedStudentIds,
    },
  });

  if (authUserId) {
    await createAuditLog({
      ...buildAuditActor(profile),
      action: "auth_account_created",
      title: "Auth hesabı oluşturuldu",
      description: `${parsed.data.full_name} için veli auth hesabı oluşturuldu.`,
      entityType: "auth_account",
      entityId: authUserId,
      beforeData: null,
      afterData: {
        profile_id: createdParent.id,
        email: parsed.data.email,
      },
      metadata: {
        profile_id: createdParent.id,
      },
    });
  }

  await Promise.all(
    selectedStudentIds.map((studentId) =>
      createAuditLog({
        ...buildAuditActor(profile),
        action: "parent_student_linked",
        title: "Veli talebeye bağlandı",
        description: `${parsed.data.full_name} ile talebe ilişkisi oluşturuldu.`,
        entityType: "parent_student_link",
        entityId: createdParent.id,
        studentId,
        beforeData: null,
        afterData: {
          parent_profile_id: createdParent.id,
          student_id: studentId,
          relation: parsed.data.relation,
        },
      }),
    ),
  );

  revalidatePath("/veliler");
  revalidatePath(`/veliler/${createdParent.id}`);

  selectedStudentIds.forEach((studentId) => {
    revalidatePath(`/talebeler/${studentId}`);
  });

  redirect(`/veliler/${createdParent.id}${authUserId ? "?success=auth-created" : "?success=created"}`);
}

export async function updateParentProfileAction(formData: FormData) {
  const { profile } = await requireAuth();
  const parsed = parentUpdateSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirect(`/veliler/${String(formData.get("id") ?? "")}/duzenle?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Form bilgileri hatalı.")}`);
  }

  const target = await getParentProfileByIdForProfile(profile, parsed.data.id);

  if (!target) {
    redirect("/veliler?error=not-found");
  }

  if (!canEditParentProfile(profile, target.linked_students.length)) {
    redirect(`/veliler/${target.id}?error=unauthorized`);
  }

  const supabase = await createSupabaseServerClient();
  const { data: existingProfile } = parsed.data.email
    ? await supabase.from("profiles").select("id").eq("email", parsed.data.email).neq("id", target.id).maybeSingle()
    : { data: null };

  if (existingProfile) {
    redirect(`/veliler/${target.id}/duzenle?error=email`);
  }

  const photoFile = getPhotoFile(formData);
  if (photoFile) {
    validateParentPhoto(photoFile, `/veliler/${target.id}/duzenle`);
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.full_name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      is_active: parsed.data.is_active === "true",
    })
    .eq("id", target.id);

  if (error) {
    redirect(`/veliler/${target.id}/duzenle?error=save`);
  }

  if (photoFile) {
    const uploaded = await uploadProfilePhoto(target.id, photoFile).catch(() => {
      redirect(`/veliler/${target.id}/duzenle?error=photo-upload`);
    });

    if (uploaded) {
      await supabase.from("profiles").update({ photo_url: uploaded.publicUrl }).eq("id", target.id);
    }
  }

  revalidatePath("/veliler");
  revalidatePath(`/veliler/${target.id}`);
  redirect(`/veliler/${target.id}?success=profile-updated`);
}

export async function addParentStudentLinkAction(formData: FormData) {
  const { profile } = await requireAuth();
  const parsed = parentLinkSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirect(`/veliler/${String(formData.get("parent_profile_id") ?? "")}/talebeler?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Form bilgileri hatalı.")}`);
  }

  const [targetParent, visibleStudents] = await Promise.all([
    getParentProfileByIdForProfile(profile, parsed.data.parent_profile_id),
    getVisibleStudentsForParentManagement(profile),
  ]);

  if (!targetParent) {
    redirect("/veliler?error=not-found");
  }

  const visibleStudentIdSet = new Set(visibleStudents.map((student) => student.id));

  if (!visibleStudentIdSet.has(parsed.data.student_id)) {
    redirect(`/veliler/${targetParent.id}/talebeler?error=unauthorized`);
  }

  if (!canManageParentLinks(profile, targetParent.linked_students.length)) {
    redirect(`/veliler/${targetParent.id}/talebeler?error=unauthorized`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("parent_student_links").insert(parsed.data);

  if (error) {
    redirect(`/veliler/${targetParent.id}/talebeler?error=parent-link-create`);
  }

  await createAuditLog({
    ...buildAuditActor(profile),
    action: "parent_student_linked",
    title: "Veli talebeye bağlandı",
    description: `${targetParent.full_name} ile ${parsed.data.student_id} arasında bağlantı oluşturuldu.`,
    entityType: "parent_student_link",
    entityId: targetParent.id,
    studentId: parsed.data.student_id,
    beforeData: null,
    afterData: parsed.data,
    metadata: {
      parent_profile_id: targetParent.id,
    },
  });

  revalidatePath(`/veliler/${targetParent.id}`);
  revalidatePath(`/veliler/${targetParent.id}/talebeler`);
  revalidatePath(`/talebeler/${parsed.data.student_id}`);
  redirect(`/veliler/${targetParent.id}/talebeler?success=student-linked`);
}

export async function removeParentStudentLinkAction(formData: FormData) {
  const { profile } = await requireAuth();
  const parsed = parentLinkSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirect(`/veliler/${String(formData.get("parent_profile_id") ?? "")}/talebeler?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Form bilgileri hatalı.")}`);
  }

  const [targetParent, visibleStudents] = await Promise.all([
    getParentProfileByIdForProfile(profile, parsed.data.parent_profile_id),
    getVisibleStudentsForParentManagement(profile),
  ]);

  if (!targetParent) {
    redirect("/veliler?error=not-found");
  }

  const visibleStudentIdSet = new Set(visibleStudents.map((student) => student.id));

  if (!visibleStudentIdSet.has(parsed.data.student_id)) {
    redirect(`/veliler/${targetParent.id}/talebeler?error=unauthorized`);
  }

  if (!canManageParentLinks(profile, targetParent.linked_students.length)) {
    redirect(`/veliler/${targetParent.id}/talebeler?error=unauthorized`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("parent_student_links")
    .delete()
    .eq("parent_profile_id", parsed.data.parent_profile_id)
    .eq("student_id", parsed.data.student_id);

  if (error) {
    redirect(`/veliler/${targetParent.id}/talebeler?error=parent-link-remove`);
  }

  await createAuditLog({
    ...buildAuditActor(profile),
    action: "parent_student_unlinked",
    title: "Veli talebeden bağ kaldırıldı",
    description: `${targetParent.full_name} ile talebe arasındaki bağlantı kaldırıldı.`,
    entityType: "parent_student_link",
    entityId: targetParent.id,
    studentId: parsed.data.student_id,
    beforeData: parsed.data,
    afterData: null,
    metadata: {
      parent_profile_id: targetParent.id,
    },
  });

  revalidatePath(`/veliler/${targetParent.id}`);
  revalidatePath(`/veliler/${targetParent.id}/talebeler`);
  revalidatePath(`/talebeler/${parsed.data.student_id}`);
  redirect(`/veliler/${targetParent.id}/talebeler?success=student-unlinked`);
}

export async function linkExistingParentToStudentAction(formData: FormData) {
  const { profile } = await requireAuth();
  const parsed = parentLinkSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirect(`/talebeler/${String(formData.get("student_id") ?? "")}?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Form bilgileri hatalı.")}`);
  }

  if (!canBindParentFromStudentDetail(profile)) {
    redirect(`/talebeler/${parsed.data.student_id}?error=unauthorized`);
  }

  const [visibleStudents, targetParent] = await Promise.all([
    getVisibleStudentsForParentManagement(profile),
    getParentProfileByIdForProfile(profile, parsed.data.parent_profile_id),
  ]);

  if (!visibleStudents.some((student) => student.id === parsed.data.student_id)) {
    redirect(`/talebeler/${parsed.data.student_id}?error=unauthorized`);
  }

  if (!targetParent) {
    redirect(`/talebeler/${parsed.data.student_id}?error=unauthorized`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("parent_student_links").insert(parsed.data);

  if (error) {
    redirect(`/talebeler/${parsed.data.student_id}?error=parent-link-create`);
  }

  await createAuditLog({
    ...buildAuditActor(profile),
    action: "parent_student_linked",
    title: "Veli talebeye bağlandı",
    description: `${targetParent.full_name} talebeye bağlandı.`,
    entityType: "parent_student_link",
    entityId: targetParent.id,
    studentId: parsed.data.student_id,
    beforeData: null,
    afterData: parsed.data,
    metadata: {
      parent_profile_id: targetParent.id,
      source: "talebe-detay",
    },
  });

  revalidatePath(`/talebeler/${parsed.data.student_id}`);
  revalidatePath(`/veliler/${parsed.data.parent_profile_id}`);
  redirect(`/talebeler/${parsed.data.student_id}?success=parent-linked`);
}

function getPhotoFile(formData: FormData) {
  const value = formData.get("photo");
  return value instanceof File && value.size > 0 ? value : null;
}

function validateParentPhoto(file: File, path: string) {
  try {
    validateImageFile(file);
  } catch {
    redirect(`${path}?error=photo`);
  }
}
