import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();

  try {
    await supabase.auth.signOut();
  } catch {
    // Session might already be invalid; proceed to redirect
  }

  return NextResponse.redirect(new URL("/login", request.url), {
    status: 303,
  });
}
