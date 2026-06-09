import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { getCurrentAuthState } from "@/lib/auth";
import { getDefaultPathForRole } from "@/lib/route-permissions";

export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams: Promise<{
    debug?: string;
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const { user, profile } = await getCurrentAuthState();
  const debugMode = params?.debug === "1";

  if (profile) {
    redirect(getDefaultPathForRole(profile.role));
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f0f5f8] px-4">
      {/* Decorative background pattern */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 size-80 rounded-full bg-[#093657]/5" />
        <div className="absolute -bottom-40 -left-40 size-80 rounded-full bg-[#093657]/5" />
      </div>

      <section className="relative w-full max-w-md">
        {/* Logo and header area */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex size-20 items-center justify-center rounded-xl bg-white shadow-md ring-1 ring-[#e5e7eb]">
            <img src="/logo.svg" alt="Nizamiye" className="size-14 object-contain" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#093657]/60">Nizamiye Eğitim Kurumu</p>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-[#093657]">Öğrenci Yönetim Sistemi</h1>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">Panele erişmek için yetkili hesabınızla giriş yapın.</p>
        </div>

        {/* Login card */}
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
          {debugMode && user && !profile ? (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-sm font-medium text-amber-800">Debug: aktif profil bulunamadı</p>
              <p className="mt-1.5 break-all text-xs text-amber-600">user.id: {user.id}</p>
              <p className="mt-1 break-all text-xs text-amber-600">user.email: {user.email ?? "-"}</p>
            </div>
          ) : null}
          <LoginForm />
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Nizamiye Eğitim Kurumu
        </p>
      </section>
    </main>
  );
}
