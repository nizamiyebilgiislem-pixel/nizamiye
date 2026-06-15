import { redirect } from "next/navigation";
import Image from "next/image";

import { LoginForm } from "@/components/auth/login-form";
import { getCurrentAuthState } from "@/lib/auth";
import { getDefaultPathForRole } from "@/lib/route-permissions";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const { profile } = await getCurrentAuthState();

  if (profile) {
    redirect(getDefaultPathForRole(profile.role));
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#f0f5f8] via-white to-[#e8f0f5] px-4">
      {/* Decorative background elements */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-48 -right-48 size-96 rounded-full bg-[#093657]/[0.04]" />
        <div className="absolute -bottom-48 -left-48 size-96 rounded-full bg-[#093657]/[0.04]" />
        <div className="absolute top-1/3 left-1/4 size-64 rounded-full bg-[#093657]/[0.02]" />
        <div className="absolute bottom-1/4 right-1/3 size-48 rounded-full bg-[#093657]/[0.02]" />
      </div>

      <section className="relative w-full max-w-[420px]">
        {/* Logo and header area */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-6">
            <Image
              src="/logobeyaz.png"
              alt="Nizamiye"
              width={140}
              height={80}
              className="h-20 w-auto object-contain"
              priority
            />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#093657]/50">Nizamiye Eğitim Kurumları</p>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-[#093657]">Öğrenci Yönetim Sistemi</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Panele erişmek için yetkili hesabınızla giriş yapın.
          </p>
        </div>

        {/* Login card */}
        <div className="rounded-2xl border border-[#e5e7eb] bg-white/80 p-8 shadow-xl shadow-[#093657]/5 backdrop-blur-sm">
          <LoginForm />
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Nizamiye Eğitim Kurumları
          </p>
        </div>
      </section>
    </main>
  );
}
