"use client";

import { LogOut, Menu } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

import { AssistantLauncher } from "@/components/assistant/assistant-launcher";
import { ProfileAvatar } from "@/components/profiles/profile-avatar";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { NotificationBadge } from "@/components/ui/notification-badge";
import { roleLabels } from "@/lib/route-permissions";
import type { NavigationGroup } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import type { ProfileRow } from "@/types/database";

type PanelShellProps = {
  children: React.ReactNode;
  navigationGroups: NavigationGroup[];
  profile: ProfileRow;
};

export function PanelShell({ children, navigationGroups, profile }: PanelShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const roleLabel = roleLabels[profile.role];
  const canUseAssistant = ["admin", "genel_mudur", "yonetim", "bolum_muduru", "hoca", "kutuphane_gorevlisi", "destek_birim_muduru", "rehberlik", "veli"].includes(profile.role);

  return (
    <div className="min-h-screen bg-[#f6f8fa] text-foreground">
      <div className="flex min-h-screen">
        <Sidebar groups={navigationGroups} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex min-w-0 flex-1 flex-col lg:pl-72">
          {/* Header */}
          <header className="sticky top-0 z-30 border-b border-[#e5e7eb] bg-white/95 backdrop-blur">
            <div className="flex h-16 items-center gap-4 px-5 lg:px-8">
              {/* Mobile menu button */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9 text-[#64748b] hover:bg-[#f4f8fc] hover:text-[#093657] lg:hidden"
                onClick={() => setSidebarOpen(true)}
                aria-label="Menüyü aç"
              >
                <Menu className="size-5" aria-hidden="true" />
              </Button>

              {/* Spacer */}
              <div className="flex-1" />

              {/* User section */}
              <div className="flex items-center gap-3">
                <NotificationBadge />
                <Link
                  href="/hesabim"
                  className="flex items-center gap-3 rounded-lg border border-[#e5e7eb] bg-white px-3 py-1.5 shadow-sm transition-all hover:border-[#d1dae3] hover:bg-[#fafcfd]"
                >
                  <ProfileAvatar name={profile.full_name} photoUrl={profile.photo_url} size="sm" />
                  <div className="hidden min-w-0 sm:block">
                    <p className="truncate text-sm font-medium text-[#0f172a]">{profile.full_name}</p>
                    <p className="text-xs text-[#64748b]">{roleLabel}</p>
                  </div>
                </Link>

                <form action="/auth/logout" method="post">
                  <Button
                    type="submit"
                    variant="ghost"
                    size="icon"
                    aria-label="Çıkış yap"
                    className="size-9 text-[#64748b] hover:bg-red-50 hover:text-red-600"
                  >
                    <LogOut className="size-[18px]" aria-hidden="true" />
                  </Button>
                </form>
              </div>
            </div>
          </header>

          {/* Main content */}
          <main data-print-root="true" className={cn("flex-1 px-5 py-6 lg:px-8")}>{children}</main>
        </div>
      </div>

      {canUseAssistant ? <AssistantLauncher profile={profile} /> : null}
    </div>
  );
}
