"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAuth } from "@/lib/auth";
import { buildAuditActor, createAuditLog } from "@/lib/audit/log";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { canCreateSession, canEditSession, canDeleteSession, canJoinSession } from "@/lib/live-sessions/permissions";
import { logSupabaseActionError, buildFriendlyDbErrorMessage } from "@/lib/supabase-action-error";

const sessionTypes = ["ogretmen_toplantisi", "konuk_semineri", "bolum_toplantisi", "veli_gorusmesi", "ozel_etkinlik"] as const;

const createSessionSchema = z.object({
  title: z.string().min(1, "Başlık zorunludur."),
  description: z.string().optional(),
  session_type: z.enum(sessionTypes),
  start_time: z.string().min(1, "Başlangıç zamanı zorunludur."),
  end_time: z.string().optional(),
  max_participants: z.coerce.number().int().min(1).optional(),
  department_id: z.string().optional(),
  notes: z.string().optional(),
});

const updateSessionSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, "Başlık zorunludur."),
  description: z.string().optional(),
  session_type: z.enum(sessionTypes),
  start_time: z.string().min(1, "Başlangıç zamanı zorunludur."),
  end_time: z.string().optional(),
  max_participants: z.coerce.number().int().min(1).optional(),
  department_id: z.string().optional(),
  notes: z.string().optional(),
});

function generateRoomName(): string {
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `nizamiye-${digits}`;
}

export async function createSessionAction(_previousState: unknown, formData: FormData) {
  const { profile } = await requireAuth();

  if (!canCreateSession(profile)) {
    return { error: "Bu işlem için yetkiniz bulunmamaktadır." };
  }

  const raw = Object.fromEntries(formData);
  const parsed = createSessionSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues.map((e) => e.message).join(", ") };
  }

  const { title, description, session_type, start_time, end_time, max_participants, department_id, notes } = parsed.data;

  const supabase = createSupabaseAdminClient();
  const room_name = generateRoomName();

  const { data: session, error } = await supabase
    .from("live_sessions")
    .insert({
      title,
      description: description || null,
      session_type,
      room_name,
      start_time,
      end_time: end_time || null,
      max_participants: max_participants ?? 20,
      created_by: profile.id,
      department_id: department_id || null,
      notes: notes || null,
    })
    .select("id")
    .single();

  if (error) {
    logSupabaseActionError({ action: "createSession", profile, payload: parsed.data, error });
    return { error: buildFriendlyDbErrorMessage(error) };
  }

  createAuditLog({
    ...buildAuditActor(profile),
    action: "live_session_created",
    entityType: "live_session",
    entityId: session.id,
    title: "Canlı oturum oluşturuldu",
    description: `"${title}" oturumu oluşturuldu.`,
  });

  revalidatePath("/canli-oturumlar");
  return { success: true, sessionId: session.id };
}

export async function updateSessionAction(_previousState: unknown, formData: FormData) {
  const { profile } = await requireAuth();

  const supabase = createSupabaseAdminClient();

  const raw = Object.fromEntries(formData);
  const parsed = updateSessionSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues.map((e) => e.message).join(", ") };
  }

  const { id, title, description, session_type, start_time, end_time, max_participants, department_id, notes } = parsed.data;

  const { data: session } = await supabase
    .from("live_sessions")
    .select("*")
    .eq("id", id)
    .single();

  if (!session) {
    return { error: "Oturum bulunamadı." };
  }

  if (!canEditSession(profile, session)) {
    return { error: "Bu işlem için yetkiniz bulunmamaktadır." };
  }

  if (session.status === "completed" || session.status === "cancelled") {
    return { error: "Tamamlanmış veya iptal edilmiş oturum düzenlenemez." };
  }

  const { error } = await supabase
    .from("live_sessions")
    .update({
      title,
      description: description || null,
      session_type,
      start_time,
      end_time: end_time || null,
      max_participants: max_participants ?? 20,
      department_id: department_id || null,
      notes: notes || null,
    })
    .eq("id", id);

  if (error) {
    logSupabaseActionError({ action: "updateSession", profile, payload: parsed.data, error });
    return { error: buildFriendlyDbErrorMessage(error) };
  }

  createAuditLog({
    ...buildAuditActor(profile),
    action: "live_session_updated",
    entityType: "live_session",
    entityId: id,
    title: "Canlı oturum güncellendi",
    description: `"${title}" oturumu güncellendi.`,
  });

  revalidatePath("/canli-oturumlar");
  revalidatePath(`/canli-oturumlar/${id}`);
  return { success: true };
}

export async function cancelSessionAction(_previousState: unknown, formData: FormData) {
  const { profile } = await requireAuth();

  const supabase = createSupabaseAdminClient();
  const sessionId = formData.get("id") as string;

  if (!sessionId) {
    return { error: "Oturum ID gerekli." };
  }

  const { data: session } = await supabase
    .from("live_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (!session) {
    return { error: "Oturum bulunamadı." };
  }

  const { canCancelSession } = await import("@/lib/live-sessions/permissions");
  if (!canCancelSession(profile, session)) {
    return { error: "Bu işlem için yetkiniz bulunmamaktadır." };
  }

  if (session.status === "completed") {
    return { error: "Tamamlanmış oturum iptal edilemez." };
  }

  const { error } = await supabase
    .from("live_sessions")
    .update({ status: "cancelled" })
    .eq("id", sessionId);

  if (error) {
    logSupabaseActionError({ action: "cancelSession", profile, payload: { sessionId }, error });
    return { error: buildFriendlyDbErrorMessage(error) };
  }

  createAuditLog({
    ...buildAuditActor(profile),
    action: "live_session_cancelled",
    entityType: "live_session",
    entityId: sessionId,
    title: "Canlı oturum iptal edildi",
    description: `"${session.title}" oturumu iptal edildi.`,
  });

  revalidatePath("/canli-oturumlar");
  return { success: true };
}

export async function deleteSessionAction(_previousState: unknown, formData: FormData) {
  const { profile } = await requireAuth();

  const supabase = createSupabaseAdminClient();
  const sessionId = formData.get("id") as string;

  if (!sessionId) {
    return { error: "Oturum ID gerekli." };
  }

  const { data: session } = await supabase
    .from("live_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (!session) {
    return { error: "Oturum bulunamadı." };
  }

  if (!canDeleteSession(profile, session)) {
    return { error: "Bu işlem için yetkiniz bulunmamaktadır." };
  }

  const { error } = await supabase
    .from("live_sessions")
    .delete()
    .eq("id", sessionId);

  if (error) {
    logSupabaseActionError({ action: "deleteSession", profile, payload: { sessionId }, error });
    return { error: buildFriendlyDbErrorMessage(error) };
  }

  createAuditLog({
    ...buildAuditActor(profile),
    action: "live_session_deleted",
    entityType: "live_session",
    entityId: sessionId,
    title: "Canlı oturum silindi",
    description: `"${session.title}" oturumu silindi.`,
  });

  revalidatePath("/canli-oturumlar");
  return { success: true };
}

export async function joinSessionAction(_previousState: unknown, formData: FormData) {
  const { profile } = await requireAuth();

  if (!canJoinSession(profile)) {
    return { error: "Bu işlem için yetkiniz bulunmamaktadır." };
  }

  const supabase = createSupabaseAdminClient();
  const sessionId = formData.get("id") as string;

  if (!sessionId) {
    return { error: "Oturum ID gerekli." };
  }

  const { data: session } = await supabase
    .from("live_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (!session) {
    return { error: "Oturum bulunamadı." };
  }

  if (session.status === "cancelled") {
    return { error: "İptal edilmiş bir oturuma katılamazsınız." };
  }

  if (session.status === "completed") {
    return { error: "Tamamlanmış bir oturuma katılamazsınız." };
  }

  const { count } = await supabase
    .from("live_session_participants")
    .select("*", { count: "exact", head: true })
    .eq("session_id", sessionId);

  if (count !== null && count >= session.max_participants) {
    return { error: "Oturum maksimum katılımcı sayısına ulaştı." };
  }

  const { error } = await supabase
    .from("live_session_participants")
    .insert({
      session_id: sessionId,
      profile_id: profile.id,
      status: "confirmed",
    });

  if (error) {
    if (error.code === "23505") {
      return { error: "Zaten bu oturuma katılıyorsunuz." };
    }
    logSupabaseActionError({ action: "joinSession", profile, payload: { sessionId }, error });
    return { error: buildFriendlyDbErrorMessage(error) };
  }

  revalidatePath("/canli-oturumlar");
  revalidatePath(`/canli-oturumlar/${sessionId}`);
  return { success: true };
}

export async function leaveSessionAction(_previousState: unknown, formData: FormData) {
  const { profile } = await requireAuth();

  const supabase = createSupabaseAdminClient();
  const sessionId = formData.get("id") as string;

  if (!sessionId) {
    return { error: "Oturum ID gerekli." };
  }

  const { error } = await supabase
    .from("live_session_participants")
    .delete()
    .eq("session_id", sessionId)
    .eq("profile_id", profile.id);

  if (error) {
    logSupabaseActionError({ action: "leaveSession", profile, payload: { sessionId }, error });
    return { error: buildFriendlyDbErrorMessage(error) };
  }

  revalidatePath("/canli-oturumlar");
  revalidatePath(`/canli-oturumlar/${sessionId}`);
  return { success: true };
}
