"use client";

import { cn } from "@/lib/utils";
import type { MessageRowWithProfiles } from "@/lib/messages/queries";

interface MessageBubbleProps {
  message: MessageRowWithProfiles;
  isOwn: boolean;
  showAvatar?: boolean;
}

function formatTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Bugün";
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "Dün";
  } else {
    return date.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
  }
}

export function MessageBubble({ message, isOwn, showAvatar = true }: MessageBubbleProps) {
  return (
    <div className={cn("flex gap-2", isOwn ? "flex-row-reverse" : "flex-row")}>
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
          isOwn
            ? "bg-[#dcf8c6] rounded-tr-sm"
            : "bg-white rounded-tl-sm border border-[#e8e8e8]"
        )}
      >
        {!isOwn && (
          <p className="text-xs font-medium text-[#093657] mb-1">
            {message.sender?.full_name}
          </p>
        )}
        <p className="text-foreground leading-relaxed whitespace-pre-wrap break-words">
          {message.message}
        </p>
        <div
          className={cn(
            "flex items-center gap-1 mt-1",
            isOwn ? "justify-end" : "justify-start"
          )}
        >
          <span className="text-[10px] text-[#999]">
            {formatTime(message.created_at)}
          </span>
          {isOwn && (
            <svg
              className={cn(
                "w-3.5 h-3.5",
                message.is_read ? "text-[#53bdeb]" : "text-[#999]"
              )}
              viewBox="0 0 16 11"
              fill="currentColor"
            >
              <path d="M1.5 5.5L3 7l2.5-2.5 4 4L14 1.5 15.5 3l-6.5 6.5-3 1.5-2-2-3 1.5z" />
            </svg>
          )}
          {message.sent_via === "sms" && (
            <span className="text-[9px] text-[#999] bg-[#f0f0f0] px-1 rounded">
              SMS
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function MessageDateHeader({ date }: { date: string }) {
  return (
    <div className="flex items-center justify-center my-4">
      <span className="text-xs text-[#999] bg-[#e8e8e8] px-3 py-1 rounded-full">
        {formatDate(date)}
      </span>
    </div>
  );
}

export function MessageBubbleSkeleton() {
  return (
    <div className="flex gap-2">
      <div className="h-12 w-48 rounded-2xl bg-[#f0f0f0] animate-pulse" />
    </div>
  );
}