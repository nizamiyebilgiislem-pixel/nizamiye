import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDefaultPathForRole, getRouteAllowedRoles } from "@/lib/route-permissions";
import type { ProfileRow } from "@/types/database";
import type { UserRole } from "@/types/rbac";

export type CurrentSession = {
  user: User;
  profile: ProfileRow;
};

export type CurrentAuthState = {
  user: User | null;
  profile: ProfileRow | null;
  error: unknown | null;
};

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return user;
  } catch {
    return null;
  }
}

export async function getCurrentAuthState(): Promise<CurrentAuthState> {
  const user = await getCurrentUser();

  if (!user) {
    return { user: null, profile: null, error: null };
  }

  const { profile, error } = await getActiveProfileForUserId(user.id);

  return { user, profile, error };
}

export async function getActiveProfileForUserId(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("auth_user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  return { profile, error };
}

export async function getCurrentProfile() {
  const { profile } = await getCurrentAuthState();

  return profile;
}

export async function requireAuth(): Promise<CurrentSession> {
  const supabase = await createSupabaseServerClient();
  const { user, profile } = await getCurrentAuthState();

  if (!user) {
    redirect("/login");
  }

  if (!profile) {
    await supabase.auth.signOut();
    redirect("/login?error=profile");
  }

  return { user, profile };
}

export async function requireRole(allowedRoles: UserRole[]) {
  const session = await requireAuth();

  if (!allowedRoles.includes(session.profile.role)) {
    redirect(getDefaultPathForRole(session.profile.role));
  }

  return session;
}

export async function requireRouteAccess(pathname: string) {
  const allowedRoles = getRouteAllowedRoles(pathname);

  if (!allowedRoles) {
    return requireAuth();
  }

  return requireRole(allowedRoles);
}
