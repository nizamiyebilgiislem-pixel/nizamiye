"use server";

import { revalidatePath } from "next/cache";

import { requireAuth } from "@/lib/auth";
import { buildAuditActor, createAuditLog } from "@/lib/audit/log";
import { canManageModuleAssignments } from "@/lib/module-assignments/permissions";
import { getExistingAssignment } from "@/lib/module-assignments/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logSupabaseActionError, buildFriendlyDbErrorMessage } from "@/lib/supabase-action-error";

export async function createModuleAssignmentAction(_previousState: unknown, formData: FormData) {
  const { profile } = await requireAuth();

  if (!canManageModuleAssignments(profile)) {
    return { error: "Bu işlem için yetkiniz bulunmamaktadır." };
  }

  const profileId = formData.get("profile_id") as string;
  const moduleKey = formData.get("module_key") as string;

  if (!profileId || !moduleKey) {
    return { error: "Kullanıcı ve modül seçilmelidir." };
  }

  if (!["guidance", "library", "infirmary", "assistant"].includes(moduleKey)) {
    return { error: "Geçersiz modül." };
  }

  const supabase = await createSupabaseServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tbl: any = supabase.from("module_assignments");

  const existing = await getExistingAssignment(profileId, moduleKey);

  if (existing) {
    if (existing.is_active) {
      return { error: "Bu kullanıcı zaten bu modül için yetkilidir." };
    }

    const { error } = await tbl
      .update({ is_active: true, assigned_by: profile.id, updated_at: new Date().toISOString() })
      .eq("id", existing.id);

    if (error) {
      logSupabaseActionError({ action: "reactivateModuleAssignment", profile, payload: { profileId, moduleKey }, error });
      return { error: buildFriendlyDbErrorMessage(error) };
    }

    createAuditLog({
      ...buildAuditActor(profile),
      action: "module_assignment_reactivated",
      entityType: "module_assignment",
      entityId: existing.id,
      title: "Modül yetkisi yeniden aktifleştirildi",
      description: `${moduleKey} modül yetkisi yeniden aktifleştirildi.`,
      afterData: { profileId, moduleKey },
    });
  } else {
    const { data: assignment, error } = await tbl
      .insert({ profile_id: profileId, module_key: moduleKey, assigned_by: profile.id, is_active: true })
      .select("id")
      .single();

    if (error) {
      logSupabaseActionError({ action: "createModuleAssignment", profile, payload: { profileId, moduleKey }, error });
      return { error: buildFriendlyDbErrorMessage(error) };
    }

    createAuditLog({
      ...buildAuditActor(profile),
      action: "module_assignment_created",
      entityType: "module_assignment",
      entityId: assignment.id,
      title: "Modül yetkisi verildi",
      description: `${moduleKey} modül yetkisi verildi.`,
      afterData: { profileId, moduleKey },
    });
  }

  revalidatePath("/ayarlar/modul-yetkilileri");
  return { success: true };
}

export async function deactivateModuleAssignmentAction(_previousState: unknown, formData: FormData) {
  const { profile } = await requireAuth();

  if (!canManageModuleAssignments(profile)) {
    return { error: "Bu işlem için yetkiniz bulunmamaktadır." };
  }

  const assignmentId = formData.get("assignment_id") as string;

  if (!assignmentId) {
    return { error: "Yetki kaydı bulunamadı." };
  }

  const supabase = await createSupabaseServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tbl: any = supabase.from("module_assignments");

  const { data: existing } = await tbl
    .select("id, module_key, profile_id")
    .eq("id", assignmentId)
    .single();

  if (!existing) {
    return { error: "Yetki kaydı bulunamadı." };
  }

  const { error } = await tbl
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", assignmentId);

  if (error) {
    logSupabaseActionError({ action: "deactivateModuleAssignment", profile, payload: { assignmentId }, error });
    return { error: buildFriendlyDbErrorMessage(error) };
  }

  createAuditLog({
    ...buildAuditActor(profile),
    action: "module_assignment_deactivated",
    entityType: "module_assignment",
    entityId: assignmentId,
    title: "Modül yetkisi kaldırıldı",
    description: `${existing.module_key} modül yetkisi kaldırıldı.`,
    afterData: { profileId: existing.profile_id, moduleKey: existing.module_key },
  });

  revalidatePath("/ayarlar/modul-yetkilileri");
  return { success: true };
}
