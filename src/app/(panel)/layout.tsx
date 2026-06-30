import { Suspense } from "react";
import { headers } from "next/headers";

import { PanelShell } from "@/components/layout/panel-shell";
import { PanelShellSkeleton } from "@/components/layout/panel-shell-skeleton";
import { ToastProvider } from "@/components/toast/toast-provider";
import { RouteToast } from "@/components/toast/route-toast";
import { requireAuth } from "@/lib/auth";
import { requireRouteAccess } from "@/lib/auth";
import { applyNavigationBadges, getNavigationForProfile } from "@/lib/navigation";
import { getNavigationBadgeCounts } from "@/lib/notifications/queries";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

async function PanelLayoutContent({ children }: { children: React.ReactNode }) {
  const { profile } = await requireAuth();

  const headersList = await headers();
  const pathname =
    headersList.get("x-invoke-path") ||
    headersList.get("x-pathname") ||
    headersList.get("next-url") ||
    "";
  if (pathname) {
    await requireRouteAccess(pathname);
  }

  const [navigationGroups, badgeCounts] = await Promise.all([
    getNavigationForProfile(profile),
    getNavigationBadgeCounts(profile.id),
  ]);

  return (
    <PanelShell navigationGroups={applyNavigationBadges(navigationGroups, badgeCounts)} profile={profile}>
      {children}
    </PanelShell>
  );
}

export default async function PanelLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ToastProvider>
      <RouteToast />
      <Suspense fallback={<PanelShellSkeleton />}>
        <PanelLayoutContent>{children}</PanelLayoutContent>
      </Suspense>
    </ToastProvider>
  );
}
