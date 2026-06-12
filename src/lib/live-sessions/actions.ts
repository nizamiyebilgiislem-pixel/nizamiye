"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAuth } from "@/lib/auth";
import { buildAuditActor, createAuditLog } from "@/lib/audit/log";
import { canCreateSession, canDeleteSession, canEditSession, canJoinSession, canViewMeeting } from "@/lib/live-sessions/permissions";
import { buildFriendlyDbErrorMessage, logSupabaseActionError } from "@/lib/supabase-action-error";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/types/rbac";

const sessionTypes = ["ogretmen_toplantisi", "konuk_semineri", "bolum_toplantisi", "veli_gorusmesi", "ozel_etkinlik"] as const;
const selectableParticipantRoles: UserRole[] = ["admin", "genel_mudur", "bolum_muduru", "hoca", "rehberlik", "destek_birim_muduru", "kutuphane_gorevlisi"];

const createSessionSchema = z.object({
  title: z.string().min(1, "Baslik zorunludur."),
  description: z.string().optional(),
  session_type: z.enum(sessionTypes),
  meeting_date: z.string().min(1, "Toplanti tarihi zorunludur."),
  start_clock: z.string().min(1, "Baslangic saati zorunludur."),
  end_clock: z.string().min(1, "Bitis saati zorunludur."),
  max_participants: z.coerce.number().int().min(1).optional(),
  department_id: z.string().optional(),
  is_all_staff: z.string().optional(),
  notes: z.string().optional(),
});

const updateSessionSchema = createSessionSchema.extend({
  id: z.string().uuid(),
});

function generateRoomName(): string {
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `nizamiye-${digits}`;
}

function getParticipantIds(formData: FormData) {
  return Array.from(new Set(formData.getAll("participant_profile_ids").map(String).filter(Boolean)));
}

function buildSessionTimes(meetingDate: string, startClock: string, endClock: string) {
  const startTime = `${meetingDate}T${startClock}`;
  const endTime = `${meetingDate}T${endClock}`;
  const startDate = new Date(startTime);
  const endDate = new Date(endTime);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return { error: "Tarih veya saat bilgisi gecersiz." };
  }

  if (endDate <= startDate) {
    return { error: "Bitis saati baslangic saatinden sonra olmalidir. Geceyi asan oturumlar bu fazda desteklenmiyor." };
  }

  return { startTime, endTime };
}

async function filterSelectableParticipantIds(ids: string[]) {
  if (ids.length === 0) return [];

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("is_active", true)
    .in("role", selectableParticipantRoles)
    .in("id", ids);

  if (error) {
    throw new Error("Katilimci listesi dogrulanamadi.");
  }

  return (data ?? []).map((profile) => profile.id);
}

async function replaceSessionParticipants(sessionId: string, participantIds: string[]) {
  const supabase = createSupabaseAdminClient();
  const { error: deleteError } = await supabase.from("live_session_participants").delete().eq("session_id", sessionId);

  if (deleteError) {
    throw new Error(buildFriendlyDbErrorMessage(deleteError));
  }

  if (participantIds.length === 0) return;

  const { error } = await supabase.from("live_session_participants").insert(
    participantIds.map((profileId) => ({
      session_id: sessionId,
      profile_id: profileId,
      status: "invited",
    })),
  );

  if (error) {
    throw new Error(buildFriendlyDbErrorMessage(error));
  }
}

export async function createSessionAction(_previousState: unknown, formData: FormData) {
  const { profile } = await requireAuth();

  if (!canCreateSession(profile)) {
    return { error: "Bu islem icin yetkiniz bulunmamaktadir." };
  }

  const parsed = createSessionSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues.map((e) => e.message).join(", ") };
  }

  const { title, description, session_type, meeting_date, start_clock, end_clock, max_participants, department_id, is_all_staff, notes } = parsed.data;
  const times = buildSessionTimes(meeting_date, start_clock, end_clock);

  if (times.error) {
    return { error: times.error };
  }

  const supabase = createSupabaseAdminClient();
  const room_name = generateRoomName();
  const participantIds = await filterSelectableParticipantIds(getParticipantIds(formData));
  const effectiveMaxParticipants = Math.max(max_participants ?? 20, participantIds.length || 1);

  const { data: session, error } = await supabase
    .from("live_sessions")
    .insert({
      title,
      description: description || null,
      session_type,
      room_name,
      start_time: times.startTime,
      end_time: times.endTime,
      max_participants: effectiveMaxParticipants,
      created_by: profile.id,
      department_id: department_id || null,
      is_all_staff: is_all_staff === "on",
      notes: notes || null,
    })
    .select("id")
    .single();

  if (error) {
    logSupabaseActionError({ action: "createSession", profile, payload: parsed.data, error });
    return { error: buildFriendlyDbErrorMessage(error) };
  }

  try {
    await replaceSessionParticipants(session.id, participantIds);
  } catch (participantError) {
    await supabase.from("live_sessions").delete().eq("id", session.id);
    return { error: participantError instanceof Error ? participantError.message : "Katilimcilar kaydedilemedi." };
  }

  createAuditLog({
    ...buildAuditActor(profile),
    action: "live_session_created",
    entityType: "live_session",
    entityId: session.id,
    title: "Canli oturum olusturuldu",
    description: `"${title}" oturumu olusturuldu.`,
  });

  revalidatePath("/canli-oturumlar");
  return { success: true, sessionId: session.id };
}

export async function updateSessionAction(_previousState: unknown, formData: FormData) {
  const { profile } = await requireAuth();
  const supabase = createSupabaseAdminClient();
  const parsed = updateSessionSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues.map((e) => e.message).join(", ") };
  }

  const { id, title, description, session_type, meeting_date, start_clock, end_clock, max_participants, department_id, is_all_staff, notes } = parsed.data;
  const times = buildSessionTimes(meeting_date, start_clock, end_clock);

  if (times.error) {
    return { error: times.error };
  }

  const { data: session } = await supabase.from("live_sessions").select("*").eq("id", id).single();

  if (!session) {
    return { error: "Oturum bulunamadi." };
  }

  if (!canEditSession(profile, session)) {
    return { error: "Bu islem icin yetkiniz bulunmamaktadir." };
  }

  if (session.status === "completed" || session.status === "cancelled") {
    return { error: "Tamamlanmis veya iptal edilmis oturum duzenlenemez." };
  }

  const participantIds = await filterSelectableParticipantIds(getParticipantIds(formData));
  const effectiveMaxParticipants = Math.max(max_participants ?? 20, participantIds.length || 1);
  const { error } = await supabase
    .from("live_sessions")
    .update({
      title,
      description: description || null,
      session_type,
      start_time: times.startTime,
      end_time: times.endTime,
      max_participants: effectiveMaxParticipants,
      department_id: department_id || null,
      is_all_staff: is_all_staff === "on",
      notes: notes || null,
    })
    .eq("id", id);

  if (error) {
    logSupabaseActionError({ action: "updateSession", profile, payload: parsed.data, error });
    return { error: buildFriendlyDbErrorMessage(error) };
  }

  try {
    await replaceSessionParticipants(id, participantIds);
  } catch (participantError) {
    return { error: participantError instanceof Error ? participantError.message : "Katilimcilar kaydedilemedi." };
  }

  createAuditLog({
    ...buildAuditActor(profile),
    action: "live_session_updated",
    entityType: "live_session",
    entityId: id,
    title: "Canli oturum guncellendi",
    description: `"${title}" oturumu guncellendi.`,
  });

  revalidatePath("/canli-oturumlar");
  revalidatePath(`/canli-oturumlar/${id}`);
  return { success: true, sessionId: id };
}

export async function cancelSessionAction(_previousState: unknown, formData: FormData) {
  const { profile } = await requireAuth();
  const supabase = createSupabaseAdminClient();
  const sessionId = formData.get("id") as string;

  if (!sessionId) {
    return { error: "Oturum ID gerekli." };
  }

  const { data: session } = await supabase.from("live_sessions").select("*").eq("id", sessionId).single();

  if (!session) {
    return { error: "Oturum bulunamadi." };
  }

  if (!canDeleteSession(profile, session)) {
    return { error: "Bu islem icin yetkiniz bulunmamaktadir." };
  }

  if (session.status === "completed") {
    return { error: "Tamamlanmis oturum iptal edilemez." };
  }

  const { error } = await supabase.from("live_sessions").update({ status: "cancelled" }).eq("id", sessionId);

  if (error) {
    logSupabaseActionError({ action: "cancelSession", profile, payload: { sessionId }, error });
    return { error: buildFriendlyDbErrorMessage(error) };
  }

  createAuditLog({
    ...buildAuditActor(profile),
    action: "live_session_cancelled",
    entityType: "live_session",
    entityId: sessionId,
    title: "Canli oturum iptal edildi",
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

  const { data: session } = await supabase.from("live_sessions").select("*").eq("id", sessionId).single();

  if (!session) {
    return { error: "Oturum bulunamadi." };
  }

  if (!canDeleteSession(profile, session)) {
    return { error: "Bu islem icin yetkiniz bulunmamaktadir." };
  }

  const { error } = await supabase.from("live_sessions").delete().eq("id", sessionId);

  if (error) {
    logSupabaseActionError({ action: "deleteSession", profile, payload: { sessionId }, error });
    return { error: buildFriendlyDbErrorMessage(error) };
  }

  createAuditLog({
    ...buildAuditActor(profile),
    action: "live_session_deleted",
    entityType: "live_session",
    entityId: sessionId,
    title: "Canli oturum silindi",
    description: `"${session.title}" oturumu silindi.`,
  });

  revalidatePath("/canli-oturumlar");
  return { success: true };
}

export async function joinSessionAction(_previousState: unknown, formData: FormData) {
  const { profile } = await requireAuth();

  if (!canJoinSession(profile)) {
    return { error: "Bu islem icin yetkiniz bulunmamaktadir." };
  }

  const supabase = createSupabaseAdminClient();
  const sessionId = formData.get("id") as string;

  if (!sessionId) {
    return { error: "Oturum ID gerekli." };
  }

  const { data: session } = await supabase.from("live_sessions").select("*").eq("id", sessionId).single();

  if (!session) {
    return { error: "Oturum bulunamadi." };
  }

  const { data: participants } = await supabase.from("live_session_participants").select("profile_id").eq("session_id", sessionId);
  const participantIds = (participants ?? []).map((participant) => participant.profile_id);

  if (!canViewMeeting(profile, session, participantIds)) {
    return { error: "Bu oturuma katilma yetkiniz bulunmamaktadir." };
  }

  if (session.status === "cancelled") {
    return { error: "Iptal edilmis bir oturuma katilamazsiniz." };
  }

  if (session.status === "completed") {
    return { error: "Tamamlanmis bir oturuma katilamazsiniz." };
  }

  const { count } = await supabase
    .from("live_session_participants")
    .select("*", { count: "exact", head: true })
    .eq("session_id", sessionId);

  if (count !== null && count >= session.max_participants && !participantIds.includes(profile.id)) {
    return { error: "Oturum maksimum katilimci sayisina ulasti." };
  }

  const existingParticipant = participantIds.includes(profile.id);
  const { error } = existingParticipant
    ? await supabase
        .from("live_session_participants")
        .update({ status: "confirmed", joined_at: new Date().toISOString() })
        .eq("session_id", sessionId)
        .eq("profile_id", profile.id)
    : await supabase.from("live_session_participants").insert({
        session_id: sessionId,
        profile_id: profile.id,
        status: "confirmed",
        joined_at: new Date().toISOString(),
      });

  if (error) {
    if (error.code === "23505") {
      return { error: "Zaten bu oturuma katiliyorsunuz." };
    }
    logSupabaseActionError({ action: "joinSession", profile, payload: { sessionId }, error });
    return { error: buildFriendlyDbErrorMessage(error) };
  }

  revalidatePath("/canli-oturumlar");
  revalidatePath(`/canli-oturumlar/${sessionId}`);
  return { success: true };
}

export async function markAttendedAction(sessionId: string, profileId: string) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("live_session_participants").upsert(
    {
      session_id: sessionId,
      profile_id: profileId,
      status: "attended",
      joined_at: new Date().toISOString(),
    },
    { onConflict: "session_id,profile_id" },
  );

  if (error) {
    console.error("markAttended error:", error);
  }
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
    .update({ status: "declined", left_at: new Date().toISOString() })
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
