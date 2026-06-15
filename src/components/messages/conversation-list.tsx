"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import type { ProfileRow } from "@/types/database";

export type ConversationItem = {
  id: string;
  profile: Pick<ProfileRow, "id" | "full_name" | "role">;
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
};

interface ConversationListProps {
  conversations: ConversationItem[];
  currentProfileId?: string;
}

function getRoleLabel(role: string) {
  const labels: Record<string, string> = {
    veli: "Veli",
    hoca: "Öğretmen",
    bolum_muduru: "Bölüm Müdürü",
    genel_mudur: "Genel Müdür",
    admin: "Yönetici",
  };
  return labels[role] ?? role;
}

function getRoleColor(role: string) {
  const colors: Record<string, string> = {
    veli: "bg-emerald-100 text-emerald-700",
    hoca: "bg-blue-100 text-blue-700",
    bolum_muduru: "bg-purple-100 text-purple-700",
    genel_mudur: "bg-amber-100 text-amber-700",
    admin: "bg-gray-100 text-gray-700",
  };
  return colors[role] ?? "bg-gray-100 text-gray-700";
}

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "şimdi";
  if (diffMins < 60) return `${diffMins} dk`;
  if (diffHours < 24) return `${diffHours} sa`;
  if (diffDays === 1) return "Dün";
  if (diffDays < 7) return `${diffDays} gün`;
  return date.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

export function ConversationList({ conversations, currentProfileId }: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <svg
          className="w-16 h-16 text-[#ccc] mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <p className="text-[#999] text-sm">Henüz mesajınız yok</p>
        <Link
          href="/mesajlar/yeni"
          className="mt-3 text-sm text-[#093657] hover:underline"
        >
          Yeni mesaj başlat
        </Link>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {conversations.map((conv) => (
        <Link
          key={conv.id}
          href={`/mesajlar/${conv.id}`}
          className={cn(
            "flex items-center gap-3 px-4 py-3 hover:bg-[#f5f5f5] transition-colors",
            conv.unread > 0 && "bg-[#f0f7ff]"
          )}
        >
          <div className="relative">
            <Avatar
              name={conv.profile.full_name}
              size="md"
              className="shrink-0"
            />
            {conv.unread > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#25d5] text-white text-[10px] font-medium rounded-full flex items-center justify-center">
                {conv.unread > 9 ? "9+" : conv.unread}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className={cn("text-sm font-medium truncate", conv.unread > 0 && "font-semibold")}>
                {conv.profile.full_name}
              </h3>
              <span className="text-[10px] text-[#999] shrink-0 ml-2">
                {formatRelativeTime(conv.lastMessageAt)}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", getRoleColor(conv.profile.role))}>
                {getRoleLabel(conv.profile.role)}
              </span>
              <p className="text-xs text-[#666] truncate flex-1">
                {conv.lastMessage}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export function ConversationListSkeleton() {
  return (
    <div className="divide-y divide-border">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <div className="w-10 h-10 rounded-full bg-[#e8e8e8] animate-pulse shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 bg-[#e8e8e8] rounded animate-pulse" />
            <div className="h-3 w-48 bg-[#e8e8e8] rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}