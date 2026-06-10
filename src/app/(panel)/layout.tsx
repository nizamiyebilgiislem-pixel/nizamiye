import { PanelShell } from "@/components/layout/panel-shell";
import { ToastProvider } from "@/components/toast/toast-provider";
import { RouteToast } from "@/components/toast/route-toast";
import { requireAuth } from "@/lib/auth";
import { getNavigationForProfile } from "@/lib/navigation";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function PanelLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { profile } = await requireAuth();
  const navigationGroups = await getNavigationForProfile(profile);

  return (
    <ToastProvider>
      <RouteToast />
      <PanelShell navigationGroups={navigationGroups} profile={profile}>
        {children}
      </PanelShell>
    </ToastProvider>
  );
}
