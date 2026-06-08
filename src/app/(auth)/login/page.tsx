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
    <main className="flex min-h-screen items-center justify-center bg-background px-4 dark">
      <section className="w-full max-w-sm rounded-lg border border-border bg-card p-6 text-card-foreground shadow-sm">
        <div className="mb-6">
          <p className="text-sm font-medium text-primary">Nizamiye Öğrenci Sistemi</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Giriş</h1>
          <p className="mt-2 text-sm text-muted-foreground">Yetkili hesabınızla panele giriş yapın.</p>
        </div>
        {debugMode && user && !profile ? (
          <div className="mb-4 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-foreground">
            <p className="font-medium">Debug: aktif profil bulunamadı</p>
            <p className="mt-2 break-all text-xs text-muted-foreground">user.id: {user.id}</p>
            <p className="mt-1 break-all text-xs text-muted-foreground">user.email: {user.email ?? "-"}</p>
          </div>
        ) : null}
        <LoginForm />
      </section>
    </main>
  );
}
