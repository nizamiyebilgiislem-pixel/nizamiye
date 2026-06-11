import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ProfileRow, LiveSessionRow, LiveSessionParticipantRow } from "@/types/database";

export type SessionRowWithRelations = LiveSessionRow & {
  creator: { id: string; full_name: string } | null;
  department: { id: string; name: string } | null;
  participants: ParticipantWithProfile[];
  participant_count: number;
};

export type ParticipantWithProfile = LiveSessionParticipantRow & {
  profile: { id: string; full_name: string; photo_url: string | null };
};

const sessionSelectFields = `
  *,
  creator:created_by(id, full_name),
  department:department_id(id, name),
  participants:live_session_participants(
    *,
    profile:profile_id(id, full_name, photo_url)
  )
`;

export async function getSessions(profile: ProfileRow): Promise<SessionRowWithRelations[]> {
  const supabase = createSupabaseAdminClient();

  let query = supabase
    .from("live_sessions")
    .select(sessionSelectFields)
    .order("start_time", { ascending: false });

  if (!["admin", "genel_mudur"].includes(profile.role)) {
    if (profile.role === "bolum_muduru" && profile.department_id) {
      query = query.or(
        `department_id.eq.${profile.department_id},created_by.eq.${profile.id}`,
      );
    } else {
      query = query.or(
        `created_by.eq.${profile.id},live_session_participants.profile_id.eq.${profile.id}`,
      );
    }
  }

  const { data } = await query;
  return ((data ?? []) as unknown as SessionRowWithRelations[]).map(
    (s) => ({
      ...s,
      participant_count: s.participants?.length ?? 0,
    }),
  );
}

export async function getSessionById(id: string) {
  const supabase = createSupabaseAdminClient();

  const { data: session } = await supabase
    .from("live_sessions")
    .select(sessionSelectFields)
    .eq("id", id)
    .single();

  if (!session) return null;

  return {
    ...(session as unknown as SessionRowWithRelations),
    participant_count: (session as unknown as SessionRowWithRelations).participants?.length ?? 0,
  } as SessionRowWithRelations;
}

export async function getUpcomingSessions(profile: ProfileRow) {
  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();

  let query = supabase
    .from("live_sessions")
    .select(sessionSelectFields)
    .gte("start_time", now)
    .neq("status", "cancelled")
    .order("start_time", { ascending: true })
    .limit(10);

  if (!["admin", "genel_mudur"].includes(profile.role)) {
    if (profile.role === "bolum_muduru" && profile.department_id) {
      query = query.or(
        `department_id.eq.${profile.department_id},created_by.eq.${profile.id}`,
      );
    } else {
      query = query.or(
        `created_by.eq.${profile.id},live_session_participants.profile_id.eq.${profile.id}`,
      );
    }
  }

  const { data } = await query;
  return ((data ?? []) as unknown as SessionRowWithRelations[]).map(
    (s) => ({
      ...s,
      participant_count: s.participants?.length ?? 0,
    }),
  );
}

export async function getSessionCounts(profile: ProfileRow) {
  const sessions = await getSessions(profile);
  const now = new Date().toISOString();

  return {
    total: sessions.length,
    planned: sessions.filter((s) => s.status === "planned").length,
    active: sessions.filter((s) => s.status === "active").length,
    completed: sessions.filter((s) => s.status === "completed").length,
    cancelled: sessions.filter((s) => s.status === "cancelled").length,
    upcoming: sessions.filter(
      (s) => s.start_time > now && s.status !== "cancelled",
    ).length,
    mySessions: sessions.filter((s) => s.created_by === profile.id).length,
  };
}

export async function getLiveSessionDashboardData(profile: ProfileRow) {
  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();

  let query = supabase
    .from("live_sessions")
    .select("id, title, start_time, status, session_type, room_name, created_by", {
      count: "exact",
    })
    .gte("start_time", now)
    .neq("status", "cancelled")
    .order("start_time", { ascending: true })
    .limit(5);

  if (!["admin", "genel_mudur"].includes(profile.role)) {
    if (profile.role === "bolum_muduru" && profile.department_id) {
      query = query.eq("department_id", profile.department_id);
    } else {
      query = query.eq("created_by", profile.id);
    }
  }

  const { data, count } = await query;

  return {
    upcomingSessions: (data ?? []) as Pick<
      LiveSessionRow,
      "id" | "title" | "start_time" | "status" | "session_type" | "room_name" | "created_by"
    >[],
    upcomingCount: count ?? 0,
  };
}
