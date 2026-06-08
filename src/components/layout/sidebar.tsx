"use client";

import {
  Bell,
  BookOpen,
  Circle,
  ClipboardList,
  CalendarDays,
  Bed,
  FileText,
  GraduationCap,
  Home,
  LayoutDashboard,
  LibraryBig,
  ShieldAlert,
  School,
  Settings,
  Stethoscope,
  Users,
  UsersRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import type { NavigationGroup } from "@/lib/navigation";
import { cn } from "@/lib/utils";

const iconMap: Record<string, typeof Circle> = {
  dashboard: LayoutDashboard,
  students: GraduationCap,
  teachers: UsersRound,
  departments: LibraryBig,
  classes: School,
  grades: BookOpen,
  calendar: CalendarDays,
  evaluations: ClipboardList,
  infirmary: Stethoscope,
  announcements: Bell,
  documents: FileText,
  home: Home,
  audit: ShieldAlert,
  users: Users,
  settings: Settings,
  attendance: ClipboardList,
  dormitory: Bed,
};

type SidebarProps = {
  groups: NavigationGroup[];
  isOpen: boolean;
  onClose: () => void;
};

export function Sidebar({ groups, isOpen, onClose }: SidebarProps) {
  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-background/70 backdrop-blur-sm transition-opacity lg:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
          <div className="flex size-10 items-center justify-center rounded-md border border-white/15 bg-white text-[#093657] shadow-sm">
            <span className="text-sm font-semibold">N</span>
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">Nizamiye</p>
            <p className="truncate text-xs text-[#ddeaf0]">Öğrenci Yönetim Sistemi</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="ml-auto border border-white/10 text-white hover:bg-white/12 hover:text-white lg:hidden"
            onClick={onClose}
            aria-label="Menüyü kapat"
          >
            <X className="size-5" aria-hidden="true" />
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-5">
            {groups.map((group) => (
              <div key={group.label}>
                <p className="px-3 text-xs font-medium uppercase tracking-wide text-[#a9c0cf]">
                  {group.label}
                </p>
                <div className="mt-2 space-y-1">
                  {group.items.map((item) => (
                    <SidebarLink key={item.href} href={item.href} label={item.label} iconKey={item.iconKey} onClick={onClose} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </nav>

        <div className="border-t border-sidebar-border p-4">
          <div className="rounded-md border border-white/10 bg-white/5 p-3">
            <p className="text-sm font-medium text-white">Kurumsal Panel</p>
            <p className="mt-1 text-xs leading-5 text-[#ddeaf0]">
              Yönetim, kayıt ve takip işlemleri için sadeleştirilmiş görünüm.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}

type SidebarLinkProps = {
  href: string;
  label: string;
  iconKey: string;
  onClick: () => void;
};

function SidebarLink({ href, label, iconKey, onClick }: SidebarLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;
  const Icon = iconMap[iconKey] ?? Circle;

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
        isActive
          ? "bg-white text-[#093657] shadow-sm"
        : "text-[#ddeaf0] hover:bg-white/12 hover:text-white",
      )} 
    >
      <Icon className="size-4 shrink-0" aria-hidden={true} />
      <span className="truncate">{label}</span>
    </Link>
  );
}
