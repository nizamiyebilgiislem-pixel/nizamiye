import "server-only";

import { cookies } from "next/headers";

export const PASSWORD_RESET_FLASH_COOKIE = "password-reset-flash";

type PasswordResetFlashPayload = {
  source: "hocalar" | "kullanicilar" | "veliler";
  profileId: string;
  password: string;
};

export async function setPasswordResetFlash(payload: PasswordResetFlashPayload) {
  const cookieStore = await cookies();

  cookieStore.set(PASSWORD_RESET_FLASH_COOKIE, JSON.stringify(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60,
  });
}

export async function readPasswordResetFlash(source: PasswordResetFlashPayload["source"], profileId: string) {
  const cookieStore = await cookies();
  const rawValue = cookieStore.get(PASSWORD_RESET_FLASH_COOKIE)?.value;

  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<PasswordResetFlashPayload>;

    if (parsed.source !== source || parsed.profileId !== profileId || typeof parsed.password !== "string") {
      return null;
    }

    return parsed.password;
  } catch {
    return null;
  }
}
