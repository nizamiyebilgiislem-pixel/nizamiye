"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, Loader2, Mail, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    <form className="space-y-5" method="post" onSubmit={handleSubmit}>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[#093657]" htmlFor="email">
          E-posta adresi
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]" />
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="ornek@nizamiye.edu.tr"
            className="h-11 w-full rounded-lg border border-[#dbe3ea] bg-[#fafcfd] pl-10 pr-3.5 text-sm outline-none transition-all placeholder:text-[#94a3b8] focus:border-[#093657] focus:bg-white focus:ring-2 focus:ring-[#093657]/15"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[#093657]" htmlFor="password">
          Şifre
        </label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]" />
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            className="h-11 w-full rounded-lg border border-[#dbe3ea] bg-[#fafcfd] pl-10 pr-10 text-sm outline-none transition-all placeholder:text-[#94a3b8] focus:border-[#093657] focus:bg-white focus:ring-2 focus:ring-[#093657]/15"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8] transition-colors hover:text-[#093657]"
            tabIndex={-1}
            aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <Button
        type="submit"
        className="h-11 w-full rounded-lg bg-[#093657] text-sm font-medium shadow-sm transition-all hover:bg-[#093657]/90 hover:shadow-md focus-visible:ring-2 focus-visible:ring-[#093657]/30 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isLoading}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" />
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
