"use client";

import { LogOut, Menu, Search } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

import { ProfileAvatar } from "@/components/profiles/profile-avatar";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { roleLabels, type NavigationGroup } from "@/lib/navigation";
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <Sidebar groups={navigationGroups} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex min-w-0 flex-1 flex-col lg:pl-72">
          <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
            <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
                aria-label="Menüyü aç"
              >
                <Menu className="size-5" aria-hidden="true" />
              </Button>

              <div className="hidden min-w-0 flex-1 items-center gap-2 rounded-md border border-border bg-white px-3 py-2 text-sm text-muted-foreground shadow-sm sm:flex">
                <Search className="size-4 shrink-0" aria-hidden="true" />
                <span className="truncate">Talebe, sınıf veya hoca ara</span>
              </div>

              <Link href="/hesabim" className="ml-auto hidden min-w-0 items-center gap-2 rounded-md border border-border bg-white px-3 py-2 shadow-sm transition-colors hover:bg-[#f4f8fc] sm:flex">
                <ProfileAvatar name={profile.full_name} photoUrl={profile.photo_url} size="sm" />
                <span className="max-w-44 truncate text-sm font-medium">{profile.full_name}</span>
                <span className="rounded-md bg-[#eaf1f6] px-2 py-0.5 text-xs font-medium text-[#093657]">{roleLabel}</span>
              </Link>

              <Link
                href="/hesabim"
                className={cn(buttonVariants({ variant: "ghost" }), "hidden border border-border bg-white shadow-sm hover:bg-[#f4f8fc] sm:inline-flex")}
              >
                Hesabım
              </Link>

              <form action="/auth/logout" method="post">
                <Button type="submit" variant="ghost" size="icon" aria-label="Çıkış yap" className="border border-border bg-white shadow-sm hover:bg-[#f4f8fc]">
                  <LogOut className="size-5" aria-hidden="true" />
                </Button>
              </form>
            </div>
          </header>

          <main className={cn("flex-1 px-4 py-6 sm:px-6 lg:px-8")}>{children}</main>
        </div>
      </div>
    </div>
  );
}
