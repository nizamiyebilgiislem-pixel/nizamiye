"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAuth } from "@/lib/auth";
import { buildAuditActor, createAuditLog } from "@/lib/audit/log";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { canCreateTalep, canManageTalepStatus, canEditTalep } from "@/lib/talepler/permissions";
import { logSupabaseActionError, buildFriendlyDbErrorMessage } from "@/lib/supabase-action-error";

const createTalepSchema = z.object({
  title: z.string().min(1, "Başlık zorunludur."),
  description: z.string().min(1, "Açıklama zorunludur."),
  type: z.string().optional(),
  priority: z.string().optional(),
  requested_unit: z.string().min(1, "Talep edilen birim zorunludur."),
  target_person: z.string().optional(),
  deadline: z.string().optional(),
});

const updateStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.string().min(1),
  response_note: z.string().optional(),
  rejection_reason: z.string().optional(),
  internal_note: z.string().optional(),
});

const editTalepSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, "Başlık zorunludur."),
  description: z.string().min(1, "Açıklama zorunludur."),
});

export async function createTalepAction(_previousState: unknown, formData: FormData) {
  const { profile } = await requireAuth();

  if (!canCreateTalep(profile)) {
    return { error: "Bu işlem için yetkiniz bulunmamaktadır." };
  }

  const raw = Object.fromEntries(formData);
  const parsed = createTalepSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues.map((e) => e.message).join(", ") };
  }

  const { title, description, type, priority, requested_unit, target_person, deadline } = parsed.data;
  const supabase = createSupabaseAdminClient();

  const { data: talep, error } = await supabase
    .from("talepler")
    .insert({
      title,
      description,
      type: type || "talep",
      priority: priority || "normal",
      requested_unit,
      requested_by: profile.id,
      target_person: target_person || null,
      deadline: deadline || null,
    })
    .select("id")
    .single();

  if (error) {
    logSupabaseActionError({ action: "createTalep", profile, payload: parsed.data, error });
    return { error: buildFriendlyDbErrorMessage(error) };
  }

  createAuditLog({
    ...buildAuditActor(profile),
    action: "talep_created",
    entityType: "talep",
    entityId: talep.id,
    title: "Talep oluşturuldu",
    description: `${title} talebi oluşturuldu.`,
  });

  revalidatePath("/talepler");
  return { success: true, talepId: talep.id };
}

export async function updateTalepStatusAction(_previousState: unknown, formData: FormData) {
  const { profile } = await requireAuth();

  const supabase = createSupabaseAdminClient();

  const raw = Object.fromEntries(formData);
  const parsed = updateStatusSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues.map((e) => e.message).join(", ") };
  }

  const { id, status, response_note, rejection_reason, internal_note } = parsed.data;

  const { data: talep } = await supabase
    .from("talepler")
    .select("*")
    .eq("id", id)
    .single();

  if (!talep) {
    return { error: "Talep bulunamadı." };
  }

  if (!canManageTalepStatus(profile, talep)) {
    return { error: "Bu işlem için yetkiniz bulunmamaktadır." };
  }

  const { error } = await supabase
    .from("talepler")
    .update({
      status,
      response_note: response_note || null,
      rejection_reason: (status === "reddedildi" && rejection_reason) ? rejection_reason : null,
      internal_note: internal_note || null,
      ...(!talep.assigned_to ? { assigned_to: profile.id } : {}),
    })
    .eq("id", id);

  if (error) {
    logSupabaseActionError({ action: "updateTalepStatus", profile, payload: parsed.data, error });
    return { error: buildFriendlyDbErrorMessage(error) };
  }

  createAuditLog({
    ...buildAuditActor(profile),
    action: "talep_status_updated",
    entityType: "talep",
    entityId: id,
    title: "Talep durumu güncellendi",
    description: `${talep.title} talebi "${status}" durumuna güncellendi.`,
  });

  revalidatePath("/talepler");
  return { success: true };
}

export async function editTalepAction(_previousState: unknown, formData: FormData) {
  const { profile } = await requireAuth();

  const supabase = createSupabaseAdminClient();

  const raw = Object.fromEntries(formData);
  const parsed = editTalepSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues.map((e) => e.message).join(", ") };
  }

  const { id, title, description } = parsed.data;

  const { data: talep } = await supabase
    .from("talepler")
    .select("*")
    .eq("id", id)
    .single();

  if (!talep) {
    return { error: "Talep bulunamadı." };
  }

  if (!canEditTalep(profile, talep)) {
    return { error: "Bu işlem için yetkiniz bulunmamaktadır." };
  }

  const { error } = await supabase
    .from("talepler")
    .update({ title, description })
    .eq("id", id);

  if (error) {
    logSupabaseActionError({ action: "editTalep", profile, payload: parsed.data, error });
    return { error: buildFriendlyDbErrorMessage(error) };
  }

  createAuditLog({
    ...buildAuditActor(profile),
    action: "talep_updated",
    entityType: "talep",
    entityId: id,
    title: "Talep güncellendi",
    description: `${title} talebi güncellendi.`,
  });

  revalidatePath("/talepler");
  return { success: true };
}
