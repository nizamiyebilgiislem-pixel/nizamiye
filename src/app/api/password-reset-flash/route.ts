import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { PASSWORD_RESET_FLASH_COOKIE } from "@/lib/profiles/password-reset-flash";

export async function POST() {
  const cookieStore = await cookies();

  cookieStore.set(PASSWORD_RESET_FLASH_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return NextResponse.json({ ok: true });
}
