"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProfileAvatar } from "@/components/profiles/profile-avatar";
import { Button } from "@/components/ui/button";
import { MessageInput } from "@/components/messages";
import type { ProfileRow } from "@/types/database";

type MessageWithProfiles = {
  id: string;
  sender_profile_id: string;
  recipient_profile_id: string;
  subject: string | null;
  message: string;
  is_read: boolean;
  read_at: string | null;
  sent_via: "app" | "sms" | null;
  created_at: string;
  sender: { id: string; full_name: string; role: string };
  recipient: { id: string; full_name: string; role: string };
};

type OtherProfile = {
  id: string;
  full_name: string;
  role: string;
  phone: string | null;
};

interface ConversationViewClientProps {
  otherProfile: OtherProfile;
  initialMessages: MessageWithProfiles[];
  currentProfile: ProfileRow;
  smsAvailable: boolean;
  smsLimit: number;
  smsUsed: number;
}

function groupMessagesByDate(messages: MessageWithProfiles[]) {
  const groups: { date: string; messages: MessageWithProfiles[] }[] = [];
  let currentDate = "";

  for (const msg of messages) {
    const msgDate = new Date(msg.created_at).toDateString();
    if (msgDate !== currentDate) {
      currentDate = msgDate;
      groups.push({ date: msg.created_at, messages: [msg] });
    } else {
      groups[groups.length - 1].messages.push(msg);
    }
  }

  return groups;
}

function formatDateHeader(dateString: string) {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Bugün";
  if (date.toDateString() === yesterday.toDateString()) return "Dün";
  return date.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

export function ConversationViewClient({
  otherProfile,
  initialMessages,
  currentProfile,
  smsAvailable,
  smsLimit,
  smsUsed,
}: ConversationViewClientProps) {
  const [messages, setMessages] = useState<MessageWithProfiles[]>(initialMessages);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    pollingIntervalRef.current = setInterval(async () => {
      const res = await fetch(`/api/messages?recipientId=${otherProfile.id}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    }, 5000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [otherProfile.id]);

  const handleSend = async (message: string, sendAsSms = false) => {
    return new Promise<{ error?: string }>((resolve) => {
      startTransition(async () => {
        const formData = new FormData();
        formData.append("recipientId", otherProfile.id);
        formData.append("message", message);
        formData.append("sendAsSms", sendAsSms ? "true" : "false");

        const res = await fetch("/api/messages", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (data.error) {
          resolve({ error: data.error });
        } else {
          const refreshRes = await fetch(`/api/messages?recipientId=${otherProfile.id}`);
          if (refreshRes.ok) {
            const newMessages = await refreshRes.json();
            setMessages(newMessages);
          }
          resolve({});
        }
      });
    });
  };

  const groupedMessages = groupMessagesByDate(messages);

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] min-h-[500px]">
      <div className="flex items-center gap-4 pb-4 border-b border-border">
        <Link
          href="/mesajlar"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Geri
        </Link>
        <div className="flex items-center gap-3 flex-1">
          <ProfileAvatar name={otherProfile.full_name} />
          <div>
            <h2 className="font-medium text-foreground">{otherProfile.full_name}</h2>
            <p className="text-xs text-muted-foreground capitalize">
              {otherProfile.role.replace("_", " ")}
            </p>
          </div>
        </div>
        {otherProfile.phone && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Phone className="size-3.5" />
            <span>{otherProfile.phone}</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-4 space-y-6">
        {groupedMessages.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            Henüz mesaj yok. İlk mesajı siz gönderin!
          </div>
        ) : (
          groupedMessages.map((group, gi) => (
            <div key={gi}>
              <div className="flex justify-center mb-4">
                <span className="text-xs text-[#999] bg-[#e8e8e8] px-3 py-1 rounded-full">
                  {formatDateHeader(group.date)}
                </span>
              </div>
              <div className="space-y-3 px-4">
                {group.messages.map((msg) => {
                  const isOwn = msg.sender_profile_id === currentProfile.id;
                  return (
                    <div
                      key={msg.id}
                      className={cn("flex", isOwn ? "justify-end" : "justify-start")}
                    >
                      <div
                        className={cn(
                          "max-w-[70%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                          isOwn
                            ? "bg-[#dcf8c6] rounded-tr-sm"
                            : "bg-white rounded-tl-sm border border-[#e8e8e8]"
                        )}
                      >
                        {!isOwn && (
                          <p className="text-xs font-medium text-[#093657] mb-1">
                            {msg.sender.full_name}
                          </p>
                        )}
                        <p className="text-foreground leading-relaxed whitespace-pre-wrap break-words">
                          {msg.message}
                        </p>
                        <div
                          className={cn(
                            "flex items-center gap-1 mt-1",
                            isOwn ? "justify-end" : "justify-start"
                          )}
                        >
                          <span className="text-[10px] text-[#999]">
                            {new Date(msg.created_at).toLocaleTimeString("tr-TR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {isOwn && (
                            <svg
                              className={cn(
                                "w-3.5 h-3.5",
                                msg.is_read ? "text-[#53bdeb]" : "text-[#999]"
                              )}
                              viewBox="0 0 16 11"
                              fill="currentColor"
                            >
                              <path d="M1.5 5.5L3 7l2.5-2.5 4 4L14 1.5 15.5 3l-6.5 6.5-3 1.5-2-2-3 1.5z" />
                            </svg>
                          )}
                          {msg.sent_via === "sms" && (
                            <span className="text-[9px] text-[#999] bg-[#f0f0f0] px-1 rounded">
                              SMS
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="pt-4 border-t border-border">
        <MessageInput
          onSend={handleSend}
          placeholder="Mesajınızı yazın..."
          smsAvailable={smsAvailable}
          smsLimit={smsLimit}
          smsUsed={smsUsed}
        />
      </div>
    </div>
  );
}