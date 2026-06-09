"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAuth } from "@/lib/auth";
import { buildAuditActor, createAuditLog } from "@/lib/audit/log";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { canManageAnnouncements } from "@/lib/duyurular/permissions";
import { logSupabaseActionError, buildFriendlyDbErrorMessage } from "@/lib/supabase-action-error";

const announcementSchema = z.object({
  title: z.string().min(1, "Başlık zorunludur."),
  content: z.string().min(1, "İçerik zorunludur."),
  target_role: z.string().optional(),
  department_id: z.string().optional(),
  is_published: z.string().optional(),
});

export async function createAnnouncementAction(_previousState: unknown, formData: FormData) {
  const { profile } = await requireAuth();

  if (!canManageAnnouncements(profile)) {
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
      target_role: (target_role as "admin" | "genel_mudur" | "bolum_muduru" | "hoca" | "veli") || null,
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

  const { error } = await supabase
    .from("announcements")
    .update({
      title,
      content,
      target_role: (target_role as "admin" | "genel_mudur" | "bolum_muduru" | "hoca" | "veli") || null,
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
