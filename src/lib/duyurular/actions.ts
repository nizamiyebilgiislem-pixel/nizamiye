"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAuth } from "@/lib/auth";
import { buildAuditActor, createAuditLog } from "@/lib/audit/log";
import { ANNOUNCEMENT_MODULE_KEY } from "@/lib/notifications/queries";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { canCreateAnnouncements, canManageAnnouncements } from "@/lib/duyurular/permissions";
import { logSupabaseActionError, buildFriendlyDbErrorMessage } from "@/lib/supabase-action-error";
import type { ProfileRole } from "@/types/rbac";

const announcementSchema = z.object({
  title: z.string().min(1, "Başlık zorunludur."),
  content: z.string().min(1, "İçerik zorunludur."),
  target_role: z.string().optional(),
  department_id: z.string().optional(),
  is_published: z.string().optional(),
});

async function createAnnouncementNotifications(params: {
  creatorProfileId: string;
  title: string;
  content: string;
  targetRole?: string;
  departmentId?: string;
}) {
  const adminSupabase = createSupabaseAdminClient();
  let query = adminSupabase
    .from("profiles")
    .select("id")
    .eq("is_active", true)
    .not("auth_user_id", "is", null)
    .neq("id", params.creatorProfileId);

  if (params.targetRole) {
    query = query.eq("role", params.targetRole as ProfileRole);
  }

  if (params.departmentId) {
    query = query.eq("department_id", params.departmentId);
  }

  const { data: recipients, error: recipientsError } = await query;

  if (recipientsError || !recipients || recipients.length === 0) {
    return;
  }

  const messagePreview =
    params.content.length > 180 ? `${params.content.slice(0, 177)}...` : params.content;

  await adminSupabase.from("notifications").insert(
    recipients.map((recipient) => ({
      profile_id: recipient.id,
      type: "info" as const,
      module_key: ANNOUNCEMENT_MODULE_KEY,
      title: `Yeni duyuru: ${params.title}`,
      message: messagePreview,
      sent_via: "app" as const,
    })),
  );
}

export async function createAnnouncementAction(_previousState: unknown, formData: FormData) {
  const { profile } = await requireAuth();

  if (!canCreateAnnouncements(profile)) {
    return { error: "Bu işlem için yetkiniz bulunmamaktadır." };
  }

  const raw = Object.fromEntries(formData);
  const parsed = announcementSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues.map((e) => e.message).join(", ") };
  }

  const { title, content, target_role, department_id, is_published } = parsed.data;
  const supabase = await createSupabaseServerClient();

  const { data: announcement, error } = await supabase
    .from("announcements")
    .insert({
      title,
      content,
      target_role: (target_role as "admin" | "genel_mudur" | "yonetim" | "bolum_muduru" | "hoca" | "veli" | "rehberlik") || null,
      department_id: department_id || null,
      is_published: is_published === "true",
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error) {
    logSupabaseActionError({ action: "createAnnouncement", profile, payload: parsed.data, error });
    return { error: buildFriendlyDbErrorMessage(error) };
  }

  createAuditLog({
    ...buildAuditActor(profile),
    action: "announcement_created",
    entityType: "announcement",
    entityId: announcement.id,
    title: "Duyuru oluşturuldu",
    description: `${title} duyurusu oluşturuldu.`,
  });

  if (is_published === "true") {
    await createAnnouncementNotifications({
      creatorProfileId: profile.id,
      title,
      content,
      targetRole: target_role,
      departmentId: department_id,
    });
  }

  revalidatePath("/duyurular");
  return { success: true, announcementId: announcement.id };
}

export async function updateAnnouncementAction(_previousState: unknown, formData: FormData) {
  const { profile } = await requireAuth();

  if (!canManageAnnouncements(profile)) {
    return { error: "Bu işlem için yetkiniz bulunmamaktadır." };
  }

  const raw = Object.fromEntries(formData);
  const parsed = z.object({ id: z.string().uuid() }).merge(announcementSchema).safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues.map((e) => e.message).join(", ") };
  }

  const { id, title, content, target_role, department_id, is_published } = parsed.data;
  const supabase = await createSupabaseServerClient();
  const { data: existingAnnouncement } = await supabase
    .from("announcements")
    .select("is_published")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase
    .from("announcements")
    .update({
      title,
      content,
      target_role: (target_role as "admin" | "genel_mudur" | "yonetim" | "bolum_muduru" | "hoca" | "veli" | "rehberlik") || null,
      department_id: department_id || null,
      is_published: is_published === "true",
    })
    .eq("id", id);

  if (error) {
    logSupabaseActionError({ action: "updateAnnouncement", profile, payload: parsed.data, error });
    return { error: buildFriendlyDbErrorMessage(error) };
  }

  createAuditLog({
    ...buildAuditActor(profile),
    action: "announcement_updated",
    entityType: "announcement",
    entityId: id,
    title: "Duyuru güncellendi",
    description: `${title} duyurusu güncellendi.`,
  });

  if (!existingAnnouncement?.is_published && is_published === "true") {
    await createAnnouncementNotifications({
      creatorProfileId: profile.id,
      title,
      content,
      targetRole: target_role,
      departmentId: department_id,
    });
  }

  revalidatePath("/duyurular");
  return { success: true };
}

export async function deleteAnnouncementAction(announcementId: string) {
  const { profile } = await requireAuth();

  if (!canManageAnnouncements(profile)) {
    return { error: "Bu işlem için yetkiniz bulunmamaktadır." };
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("announcements").delete().eq("id", announcementId);

  if (error) {
    return { error: "Duyuru silinemedi." };
  }

  revalidatePath("/duyurular");
  return { success: true };
}
