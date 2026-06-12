"use client";

import { useState, useSyncExternalStore } from "react";
import { ArrowLeftRight, Maximize2, MessageSquareMore, Minimize2 } from "lucide-react";

import { AssistantChat } from "@/components/assistant/assistant-chat";
import { PolaAiAvatar } from "@/components/assistant/pola-ai-avatar";
import type { ProfileRow } from "@/types/database";
import { cn } from "@/lib/utils";

type AssistantLauncherProps = {
  profile: ProfileRow;
};

type LauncherPreferences = {
  side: "left" | "right";
  compact: boolean;
};

const launcherPreferencesKey = "pola-ai-launcher-preferences";
const launcherPreferencesEvent = "pola-ai-launcher-preferences-change";
const defaultLauncherPreferences: LauncherPreferences = {
  side: "right",
  compact: false,
};
const defaultLauncherPreferencesSnapshot = JSON.stringify(defaultLauncherPreferences);

function subscribeToLauncherPreferences(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(launcherPreferencesEvent, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(launcherPreferencesEvent, callback);
  };
}

function getLauncherPreferencesSnapshot() {
  return window.localStorage.getItem(launcherPreferencesKey) ?? defaultLauncherPreferencesSnapshot;
}

function parseLauncherPreferences(snapshot: string): LauncherPreferences {
  try {
    const value = JSON.parse(snapshot) as Partial<LauncherPreferences>;

    return {
      side: value.side === "left" ? "left" : "right",
      compact: value.compact === true,
    };
  } catch {
    return defaultLauncherPreferences;
  }
}

function saveLauncherPreferences(preferences: LauncherPreferences) {
  window.localStorage.setItem(launcherPreferencesKey, JSON.stringify(preferences));
  window.dispatchEvent(new Event(launcherPreferencesEvent));
}

export function AssistantLauncher({ profile }: AssistantLauncherProps) {
  const [open, setOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const preferences = parseLauncherPreferences(
    useSyncExternalStore(
      subscribeToLauncherPreferences,
      getLauncherPreferencesSnapshot,
      () => defaultLauncherPreferencesSnapshot,
    ),
  );
  const isLeft = preferences.side === "left";
  const avatarSize = preferences.compact ? 44 : 56;

  function handleToggle() {
    setHasOpened(true);
    setOpen((value) => !value);
  }

  function handleSideToggle() {
    saveLauncherPreferences({
      ...preferences,
      side: isLeft ? "right" : "left",
    });
  }

  function handleCompactToggle() {
    saveLauncherPreferences({
      ...preferences,
      compact: !preferences.compact,
    });
  }

  return (
    <>
      {hasOpened ? (
        <div
          className={cn(
            "pointer-events-none fixed z-40 w-[min(calc(100vw-2rem),26rem)]",
            isLeft ? "left-4 sm:left-6" : "right-4 sm:right-6",
          )}
          style={{ bottom: "calc(5.5rem + env(safe-area-inset-bottom, 0px))" }}
        >
          <div
            className={cn(
              "pointer-events-auto transition duration-200",
              isLeft ? "origin-bottom-left" : "origin-bottom-right",
              open ? "translate-y-0 scale-100 opacity-100" : "translate-y-3 scale-95 opacity-0",
            )}
          >
            <AssistantChat profile={profile} variant="panel" onClose={() => setOpen(false)} />
          </div>
        </div>
      ) : null}

      <div
        className={cn("fixed z-50", isLeft ? "left-4 sm:left-6" : "right-4 sm:right-6")}
        style={{ bottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <div className={cn("flex items-end gap-2", isLeft ? "flex-row" : "flex-row-reverse")}>
          <button
            type="button"
            onClick={handleToggle}
            aria-label={open ? "Nizam Aİ Asistanını Kapat" : "Nizam Aİ Asistanını Aç"}
            aria-pressed={open}
            className={cn(
              "group relative flex items-center rounded-full border border-white/60 bg-white/96 shadow-[0_16px_40px_rgba(9,54,87,0.22)] backdrop-blur transition duration-200 hover:scale-[1.03]",
              preferences.compact ? "gap-0 p-2" : "gap-3 px-3 py-2",
              open ? "ring-2 ring-[#093657]/20" : "",
            )}
          >
            <span className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,rgba(9,54,87,0.12),transparent_70%)] opacity-0 transition-opacity group-hover:opacity-100" />
            <span className="absolute inset-0 -z-10 rounded-full bg-[#093657]/10 blur-xl" />
            <span className={cn("absolute inset-0 rounded-full border border-[#093657]/15", open ? "" : "animate-pulse")} />

            <PolaAiAvatar size={avatarSize} priority className="transition-transform duration-200 group-hover:scale-[1.04]" />

            {!preferences.compact ? (
              <span className="hidden pr-1 text-left sm:block">
                <span className="block text-sm font-semibold text-[#093657]">Nizam Aİ</span>
                <span className="block text-xs text-[#64748b]">Dijital Yardımcı</span>
              </span>
            ) : null}

            {!open && !preferences.compact ? (
              <span className="absolute -top-1 right-1 inline-flex items-center rounded-full bg-[#093657] px-2 py-0.5 text-[10px] font-medium text-white shadow-sm">
                AI
              </span>
            ) : null}

            <span className="sr-only">Nizam Aİ sohbet panelini aç veya kapat</span>
            {!preferences.compact ? <MessageSquareMore className="hidden size-4 text-[#64748b] sm:block" /> : null}
          </button>

          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={handleSideToggle}
              aria-label={isLeft ? "Nizam Aİ asistanını sağ alta taşı" : "Nizam Aİ asistanını sol alta taşı"}
              title={isLeft ? "Sağa taşı" : "Sola taşı"}
              className="flex size-8 items-center justify-center rounded-full border border-[#d8e2ea] bg-white/95 text-[#093657] shadow-sm transition hover:bg-[#eef4f8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#093657]/25"
            >
              <ArrowLeftRight className="size-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={handleCompactToggle}
              aria-label={preferences.compact ? "Nizam Aİ asistanını büyüt" : "Nizam Aİ asistanını küçült"}
              title={preferences.compact ? "Büyüt" : "Küçült"}
              className="flex size-8 items-center justify-center rounded-full border border-[#d8e2ea] bg-white/95 text-[#093657] shadow-sm transition hover:bg-[#eef4f8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#093657]/25"
            >
              {preferences.compact ? <Maximize2 className="size-3.5" aria-hidden="true" /> : <Minimize2 className="size-3.5" aria-hidden="true" />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
