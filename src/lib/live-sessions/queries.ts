import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { canViewMeeting } from "@/lib/live-sessions/permissions";
import type { ProfileRow, LiveSessionRow, LiveSessionParticipantRow } from "@/types/database";
import { isGlobalViewRole, type UserRole } from "@/types/rbac";

export type SessionRowWithRelations = LiveSessionRow & {
  creator: { id: string; full_name: string } | null;
  department: { id: string; name: string } | null;
  participants: ParticipantWithProfile[];
  participant_count: number;
};

export type ParticipantWithProfile = LiveSessionParticipantRow & {
  profile: { id: string; full_name: string; photo_url: string | null; role?: UserRole };
};

export type LiveSessionParticipantOption = Pick<ProfileRow, "id" | "full_name" | "role" | "department_id">;

const selectableParticipantRoles: UserRole[] = [
  "admin",
  "genel_mudur",
  "bolum_muduru",
  "hoca",
  "rehberlik",
  "destek_birim_muduru",
  "kutuphane_gorevlisi",
];

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
  try {
    const supabase = createSupabaseAdminClient();

    let query = supabase
      .from("live_sessions")
      .select(sessionSelectFields)
      .order("start_time", { ascending: false });

    if (!isGlobalViewRole(profile.role)) {
      if (profile.role === "bolum_muduru" && profile.department_id) {
        query = query.eq("department_id", profile.department_id);
      } else {
        query = query.eq("created_by", profile.id);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error("getSessions error:", error);
      return [];
    }

    return ((data ?? []) as unknown as SessionRowWithRelations[])
      .map((s) => ({
        ...s,
        participant_count: s.participants?.length ?? 0,
      }))
      .filter((session) => canViewMeeting(profile, session, session.participants?.map((participant) => participant.profile_id) ?? []));
  } catch (e) {
    console.error("getSessions exception:", e);
    return [];
  }
}

export async function getSessionById(id: string) {
  try {
    const supabase = createSupabaseAdminClient();

    const { data: session, error } = await supabase
      .from("live_sessions")
      .select(sessionSelectFields)
      .eq("id", id)
      .single();

    if (error || !session) {
      console.error("getSessionById error:", error);
      return null;
    }

    return {
      ...(session as unknown as SessionRowWithRelations),
      participant_count: (session as unknown as SessionRowWithRelations).participants?.length ?? 0,
    } as SessionRowWithRelations;
  } catch (e) {
    console.error("getSessionById exception:", e);
    return null;
  }
}

export async function getUpcomingSessions(profile: ProfileRow) {
  try {
    const supabase = createSupabaseAdminClient();
    const now = new Date().toISOString();

    let query = supabase
      .from("live_sessions")
      .select(sessionSelectFields)
      .gte("start_time", now)
      .neq("status", "cancelled")
      .order("start_time", { ascending: true })
      .limit(10);

    if (!isGlobalViewRole(profile.role)) {
      if (profile.role === "bolum_muduru" && profile.department_id) {
        query = query.eq("department_id", profile.department_id);
      } else {
        query = query.eq("created_by", profile.id);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error("getUpcomingSessions error:", error);
      return [];
    }

    return ((data ?? []) as unknown as SessionRowWithRelations[])
      .map((s) => ({
        ...s,
        participant_count: s.participants?.length ?? 0,
      }))
      .filter((session) => canViewMeeting(profile, session, session.participants?.map((participant) => participant.profile_id) ?? []));
  } catch (e) {
    console.error("getUpcomingSessions exception:", e);
    return [];
  }
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
  try {
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

    const { data, count, error } = await query;

    if (error) {
      console.error("getLiveSessionDashboardData error:", error);
      return { upcomingSessions: [], upcomingCount: 0 };
    }

    const sessions = (data ?? []) as Pick<
      LiveSessionRow,
      "id" | "title" | "start_time" | "status" | "session_type" | "room_name" | "created_by" | "is_all_staff"
    >[];

    return {
      upcomingSessions: sessions,
      upcomingCount: count ?? 0,
    };
  } catch (e) {
    console.error("getLiveSessionDashboardData exception:", e);
    return { upcomingSessions: [], upcomingCount: 0 };
  }
}

export async function getLiveSessionParticipantOptions(): Promise<LiveSessionParticipantOption[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, department_id")
    .eq("is_active", true)
    .in("role", selectableParticipantRoles)
    .order("full_name", { ascending: true });

  if (error) {
    console.error("getLiveSessionParticipantOptions error:", error);
    return [];
  }

  return (data ?? []) as LiveSessionParticipantOption[];
}
