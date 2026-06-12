"use client";

import { useState } from "react";
import { MessageSquareMore } from "lucide-react";

import { AssistantChat } from "@/components/assistant/assistant-chat";
import { PolaAiAvatar } from "@/components/assistant/pola-ai-avatar";
import type { ProfileRow } from "@/types/database";
import { cn } from "@/lib/utils";

type AssistantLauncherProps = {
  profile: ProfileRow;
};

export function AssistantLauncher({ profile }: AssistantLauncherProps) {
  const [open, setOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);

  function handleToggle() {
    setHasOpened(true);
    setOpen((value) => !value);
  }

  return (
    <>
      {hasOpened ? (
        <div
          className="pointer-events-none fixed right-4 z-40 w-[min(calc(100vw-2rem),26rem)] sm:right-6"
          style={{ bottom: "calc(5.5rem + env(safe-area-inset-bottom, 0px))" }}
        >
          <div
            className={cn(
              "pointer-events-auto origin-bottom-right transition duration-200",
              open ? "translate-y-0 scale-100 opacity-100" : "translate-y-3 scale-95 opacity-0",
            )}
          >
            <AssistantChat profile={profile} variant="panel" onClose={() => setOpen(false)} />
          </div>
        </div>
      ) : null}

      <div
        className="fixed right-4 z-50 sm:right-6"
        style={{ bottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <button
          type="button"
          onClick={handleToggle}
          aria-label={open ? "Pola AI Asistanını Kapat" : "Pola AI Asistanını Aç"}
          aria-pressed={open}
          className={cn(
            "group relative flex items-center gap-3 rounded-full border border-white/60 bg-white/96 px-3 py-2 shadow-[0_16px_40px_rgba(9,54,87,0.22)] backdrop-blur transition duration-200 hover:scale-[1.03]",
            open ? "ring-2 ring-[#093657]/20" : "",
          )}
        >
          <span className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,rgba(9,54,87,0.12),transparent_70%)] opacity-0 transition-opacity group-hover:opacity-100" />
          <span className="absolute inset-0 -z-10 rounded-full bg-[#093657]/10 blur-xl" />
          <span className={cn("absolute inset-0 rounded-full border border-[#093657]/15", open ? "" : "animate-pulse")} />

          <PolaAiAvatar size={56} priority className="transition-transform duration-200 group-hover:scale-[1.04]" />

          <span className="hidden pr-1 text-left sm:block">
            <span className="block text-sm font-semibold text-[#093657]">Pola AI</span>
            <span className="block text-xs text-[#64748b]">Dijital Yardımcı</span>
          </span>

          {!open ? (
            <span className="absolute -top-1 right-1 inline-flex items-center rounded-full bg-[#093657] px-2 py-0.5 text-[10px] font-medium text-white shadow-sm">
              AI
            </span>
          ) : null}

          <span className="sr-only">Pola AI sohbet panelini aç veya kapat</span>
          <MessageSquareMore className="hidden size-4 text-[#64748b] sm:block" />
        </button>
      </div>
    </>
  );
}
