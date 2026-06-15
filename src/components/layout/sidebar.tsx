"use client";

import {
  Bed,
  Bell,
  BookOpen,
  Circle,
  ClipboardList,
  CalendarDays,
  FileText,
  GraduationCap,
  HeartHandshake,
  Home,
  LayoutDashboard,
  LibraryBig,
  ListChecks,
  MessageSquare,
  ShieldAlert,
  School,
  Settings,
  Sparkles,
  Stethoscope,
  User,
  Users,
  UsersRound,
  Video,
  X,
} from "lucide-react";
import Image from "next/image";
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
  library: BookOpen,
  guidance: HeartHandshake,
  user: User,
  talepler: MessageSquare,
  tasks: ListChecks,
  video: Video,
  assistant: Sparkles,
  messages: MessageSquare,
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
          "fixed inset-0 z-40 bg-background/80 backdrop-blur-sm transition-all duration-300 ease-in-out lg:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-[#ffffff15] bg-[#093657] text-sidebar-foreground transition-transform duration-300 ease-in-out lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Logo and brand header */}
<div className="flex h-16 items-center gap-3 border-b border-[#ffffff15] px-5">
          <Image src="/logobeyaz.png" alt="Nizamiye" width={36} height={36} className="size-9 object-contain" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold text-white">Nizamiye</p>
            <p className="truncate text-xs text-[#94c5dc]">Yönetim Paneli</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 text-white/70 hover:bg-white/10 hover:text-white lg:hidden"
            onClick={onClose}
            aria-label="Menüyü kapat"
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-5">
            {groups.map((group) => (
              <div key={group.label}>
                <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-[#7ab0c7]">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item) => (
                    <SidebarLink key={item.href} href={item.href} label={item.label} iconKey={item.iconKey} onClick={onClose} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-[#ffffff15] px-4 py-4">
          <div className="rounded-lg border border-[#ffffff10] bg-[#ffffff08] p-3.5">
            <p className="text-xs font-medium text-white/90">Kurumsal Yönetim</p>
            <p className="mt-1 text-[11px] leading-relaxed text-[#7ab0c7]">
              Kayıt ve takip işlemleri
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
        "group flex h-9 items-center gap-2.5 rounded-md px-3 text-[13px] font-medium transition-all",
        isActive
          ? "bg-white text-[#093657] shadow-sm"
          : "text-[#b8d4e3] hover:bg-[#ffffff12] hover:text-white",
      )}
    >
      <Icon
        className={cn(
          "size-[18px] shrink-0 transition-colors",
          isActive ? "text-[#093657]" : "text-[#7ab0c7] group-hover:text-white/80",
        )}
        aria-hidden={true}
      />
      <span className="truncate">{label}</span>
      {isActive && (
        <span className="ml-auto size-1.5 rounded-full bg-[#093657]" />
      )}
    </Link>
  );
}
