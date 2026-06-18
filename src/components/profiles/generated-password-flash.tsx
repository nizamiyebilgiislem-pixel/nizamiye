"use client";

import { useEffect } from "react";

type GeneratedPasswordFlashProps = {
  password: string;
};

export function GeneratedPasswordFlash({ password }: GeneratedPasswordFlashProps) {
  useEffect(() => {
    void fetch("/api/password-reset-flash", {
      method: "POST",
      credentials: "same-origin",
    });
  }, []);

  return (
    <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
      Oluşturulan geçici şifre: <span className="font-semibold tracking-wide">{password}</span>
    </div>
  );
}
