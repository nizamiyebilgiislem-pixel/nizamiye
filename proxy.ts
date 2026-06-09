import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getDefaultPathForRole, getRouteAllowedRoles } from "@/lib/route-permissions";
import type { Database } from "@/types/database";

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

  if (!isProtectedRoute && !isLoginRoute) {
    await supabase.auth.getUser();
    return response;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    if (isProtectedRoute) {
      return NextResponse.redirect(new URL("/login", request.url));
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
      return NextResponse.redirect(new URL("/login?error=profile", request.url));
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
