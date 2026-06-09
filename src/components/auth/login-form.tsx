"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(() => getInitialError(searchParams.get("error")));
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const supabase = createSupabaseBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError("E-posta veya şifre hatalı.");
      setIsLoading(false);
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <form className="space-y-4" method="post" onSubmit={handleSubmit}>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[#093657]" htmlFor="email">
          E-posta adresi
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="ornek@nizamiye.edu.tr"
          className="h-11 w-full rounded-lg border border-[#dbe3ea] bg-[#fafcfd] px-3.5 text-sm outline-none transition-all placeholder:text-[#94a3b8] focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/15"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[#093657]" htmlFor="password">
          Şifre
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="••••••••"
          className="h-11 w-full rounded-lg border border-[#dbe3ea] bg-[#fafcfd] px-3.5 text-sm outline-none transition-all placeholder:text-[#94a3b8] focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/15"
        />
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <Button
        type="submit"
        className="h-11 w-full rounded-lg bg-[#093657] text-sm font-medium shadow-sm transition-colors hover:bg-[#093657]/90 focus-visible:ring-2 focus-visible:ring-[#093657]/30"
        disabled={isLoading}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Giriş yapılıyor...
          </span>
        ) : (
          "Giriş yap"
        )}
      </Button>
    </form>
  );
}

function getInitialError(error: string | null) {
  if (error === "profile") {
    return "Aktif kullanıcı profiliniz bulunamadı.";
  }

  if (error === "unauthorized") {
    return "Bu ekrana erişim yetkiniz yok.";
  }

  return null;
}
