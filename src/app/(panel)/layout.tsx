import { PanelShell } from "@/components/layout/panel-shell";
import { ToastProvider } from "@/components/toast/toast-provider";
import { RouteToast } from "@/components/toast/route-toast";
import { requireAuth } from "@/lib/auth";
import { getNavigationForRole } from "@/lib/navigation";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function PanelLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { profile } = await requireAuth();
  const navigationGroups = getNavigationForRole(profile.role);

  return (
    <ToastProvider>
      <RouteToast />
      <PanelShell navigationGroups={navigationGroups} profile={profile}>
        {children}
      </PanelShell>
    </ToastProvider>
  );
}
