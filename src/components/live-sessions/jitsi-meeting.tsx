"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { Video, Loader2, Users, CalendarDays, Clock, User } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { SessionRowWithRelations } from "@/lib/live-sessions/queries";

const sessionTypeLabels: Record<string, string> = {
  ogretmen_toplantisi: "Öğretmen Toplantısı",
  konuk_semineri: "Konuk Semineri",
  bolum_toplantisi: "Bölüm Toplantısı",
  veli_gorusmesi: "Veli Görüşmesi",
  ozel_etkinlik: "Özel Etkinlik",
};

const statusLabels: Record<string, string> = {
  planned: "Planlandı",
  active: "Aktif",
  completed: "Tamamlandı",
  cancelled: "İptal",
};

type JitsiMeetingProps = {
  session: SessionRowWithRelations;
  displayName: string;
  fullScreen?: boolean;
};

declare global {
  interface Window {
    JitsiMeetExternalAPI: new (
      domain: string,
      options: Record<string, unknown>,
    ) => {
      dispose: () => void;
      executeCommand: (command: string, ...args: unknown[]) => void;
    };
  }
}

export function JitsiMeeting({ session, displayName, fullScreen }: JitsiMeetingProps) {
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<{ dispose: () => void; executeCommand: (command: string, ...args: unknown[]) => void } | null>(null);
  const [loading, setLoading] = useState(true);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const domain = "meet.jit.si";
  const jitsiUrl = `https://${domain}/${session.room_name}#config.disableDeepLinking=true`;

  const initJitsi = useCallback(() => {
    if (!jitsiContainerRef.current || !window.JitsiMeetExternalAPI) return;

    try {
      const options: Record<string, unknown> = {
        roomName: session.room_name,
        width: "100%",
        height: "100%",
        parentNode: jitsiContainerRef.current,
        userInfo: {
          displayName,
        },
        configOverrides: {
          disableDeepLinking: true,
          disableInviteFunctions: true,
          prejoinPageEnabled: false,
          startWithAudioMuted: false,
          startWithVideoMuted: false,
        },
        interfaceConfigOverrides: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          TOOLBAR_ALWAYS_VISIBLE: true,
          SHOW_BRAND_WATERMARK: false,
          SHOW_POWERED_BY: false,
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
          DISABLE_PRESENCE_STATUS: false,
          FILM_STRIP_MAX_HEIGHT: 100,
          MOBILE_DYNAMIC_LINK: undefined,
          APP_NAME: "Nizamiye Canlı Oturum",
          NATIVE_APP_NAME: "Nizamiye OYBS",
          PROVIDER_NAME: "Nizamiye",
        },
      };

      apiRef.current = new window.JitsiMeetExternalAPI(domain, options);

      apiRef.current.executeCommand("displayName", displayName);

      setLoading(false);
    } catch {
      setError("Toplantı başlatılırken bir hata oluştu.");
      setLoading(false);
    }
  }, [session.room_name, displayName]);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = `${jitsiUrl.split("#")[0]}/external_api.js`;
    script.async = true;
    script.onload = () => {
      setScriptLoaded(true);
    };
    script.onerror = () => {
      setError("Jitsi yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.");
      setLoading(false);
    };
    document.head.appendChild(script);

    return () => {
      if (apiRef.current) {
        apiRef.current.dispose();
        apiRef.current = null;
      }
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [jitsiUrl]);

  useEffect(() => {
    if (scriptLoaded) {
      const timer = setTimeout(() => initJitsi(), 300);
      return () => clearTimeout(timer);
    }
  }, [scriptLoaded, initJitsi]);

  const containerClass = fullScreen
    ? "fixed inset-0 z-50 flex flex-col bg-black"
    : "flex min-h-[calc(100vh-4rem)] flex-col space-y-4 p-4 lg:p-6";

  const headerClass = fullScreen
    ? "flex items-center justify-between gap-4 bg-[#093657]/90 px-4 py-2"
    : "flex items-start justify-between gap-4 rounded-lg border border-[#093657]/10 bg-white p-4 shadow-sm";

  const meetingContainerClass = fullScreen
    ? "relative flex-1 overflow-hidden"
    : "relative flex-1 overflow-hidden rounded-lg border border-[#093657]/10 bg-white shadow-sm";

  return (
    <div className={containerClass}>
      <div className={headerClass}>
        <div className="flex items-center gap-2 min-w-0">
          <Video className={fullScreen ? "size-5 shrink-0 text-white" : "size-5 shrink-0 text-[#093657]"} />
          <h1 className={fullScreen ? "truncate text-sm font-semibold text-white" : "truncate text-lg font-semibold text-[#093657]"}>
            {session.title}
          </h1>
          {!fullScreen && (
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <span className="rounded-md border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium">
                  {sessionTypeLabels[session.session_type] ?? session.session_type}
                </span>
              </span>
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="size-3" />
                {new Date(session.start_time).toLocaleString("tr-TR", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </span>
              {session.end_time && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-3" />
                  {new Date(session.end_time).toLocaleString("tr-TR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Users className="size-3" />
                {session.participant_count}/{session.max_participants}
              </span>
              {session.creator && (
                <span className="inline-flex items-center gap-1">
                  <User className="size-3" />
                  {session.creator.full_name}
                </span>
              )}
              <span
                className={
                  session.status === "planned" || session.status === "active"
                    ? "font-medium text-emerald-600"
                    : "text-muted-foreground"
                }
              >
                {statusLabels[session.status] ?? session.status}
              </span>
            </div>
          )}
        </div>
        {fullScreen && (
          <Link
            href="/canli-oturumlar"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-white/80 hover:bg-white/10 hover:text-white")}
          >
            Oturumdan Çık
          </Link>
        )}
      </div>

      {error && (
        <div className={fullScreen ? "absolute left-4 right-4 top-4 z-20 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" : "rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"}>
          {error}
        </div>
      )}

      <div className={meetingContainerClass}>
        {loading && !error && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-black">
            <div className="flex size-16 items-center justify-center rounded-full bg-white/10">
              <Video className="size-8 text-white" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-white">Nizamiye Canlı Oturum</p>
              <p className="mt-1 text-xs text-white/60">Toplantıya bağlanıyor...</p>
            </div>
            <Loader2 className="size-6 animate-spin text-white" />
          </div>
        )}

        <div ref={jitsiContainerRef} className="size-full" />
      </div>
    </div>
  );
}
