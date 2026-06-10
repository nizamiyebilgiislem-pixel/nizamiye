import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getDefaultPathForRole, getRouteAllowedRoles } from "@/lib/route-permissions";
import type { Database } from "@/types/database";

function redirectToLogin(request: NextRequest, error?: string) {
  const loginUrl = new URL("/login", request.url);
  if (error) {
    loginUrl.searchParams.set("error", error);
  }
  return NextResponse.redirect(loginUrl);
}

function clearSbCookies(response: NextResponse, request: NextRequest) {
  for (const cookie of request.cookies.getAll()) {
    if (cookie.name.startsWith("sb-") || cookie.name.startsWith("supabase-")) {
      response.cookies.set(cookie.name, "", { maxAge: 0, path: "/" });
    }
  }
  return response;
}

async function getAuthUserSafe(supabase: ReturnType<typeof createServerClient<Database>>) {
  try {
    const { data } = await supabase.auth.getUser();
    return { user: data.user, error: null };
  } catch {
    return { user: null, error: "auth_error" };
  }
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const pathname = request.nextUrl.pathname;
  const allowedRoles = getRouteAllowedRoles(pathname);
  const isProtectedRoute = Boolean(allowedRoles);
  const isLoginRoute = pathname === "/login";

  const { user, error: authError } = await getAuthUserSafe(supabase);

  if (authError) {
    // Invalid or expired refresh token — clear session cookies silently
    response = clearSbCookies(response, request);
    if (isProtectedRoute) {
      return redirectToLogin(request, "session-expired");
    }
    return response;
  }

  if (!isProtectedRoute && !isLoginRoute) {
    return response;
  }

  if (!user) {
    if (isProtectedRoute) {
      return redirectToLogin(request);
    }
    return response;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("auth_user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (!profile) {
    if (isProtectedRoute) {
      await supabase.auth.signOut();
      return redirectToLogin(request, "profile");
    }
    return response;
  }

  const defaultPath = getDefaultPathForRole(profile.role);

  if (isLoginRoute) {
    return NextResponse.redirect(new URL(defaultPath, request.url));
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return NextResponse.redirect(new URL(defaultPath, request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
