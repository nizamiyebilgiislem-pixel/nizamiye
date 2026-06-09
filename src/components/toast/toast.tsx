"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export type ToastItem = {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
};

type ToastProps = {
  toast: ToastItem;
  onClose: (id: string) => void;
};

const typeStyles: Record<ToastType, { container: string; icon: string }> = {
  success: {
    container: "border-green-400/40 bg-green-50 shadow-green-500/5",
    icon: "text-green-600",
  },
  error: {
    container: "border-red-400/40 bg-red-50 shadow-red-500/5",
    icon: "text-red-600",
  },
  warning: {
    container: "border-amber-400/40 bg-amber-50 shadow-amber-500/5",
    icon: "text-amber-600",
  },
  info: {
    container: "border-[#093657]/20 bg-[#f0f5fa] shadow-[#093657]/5",
    icon: "text-[#093657]",
  },
};

const typeIcons: Record<ToastType, string> = {
  success: "✓",
  error: "✕",
  warning: "!",
  info: "i",
};

export function Toast({ toast, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const style = typeStyles[toast.type];

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));

    const dur = toast.duration ?? 5000;
    if (dur > 0) {
      timerRef.current = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose(toast.id), 300);
      }, dur);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toast.id, toast.duration, onClose]);

  return (
    <div
      className={`flex w-full max-w-sm items-start gap-3 rounded-lg border p-4 shadow-lg transition-all duration-300 ${style.container} ${
        isVisible ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0"
      }`}
    >
      <span className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${style.icon}`}>
        {typeIcons[toast.type]}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900">{toast.title}</p>
        {toast.description ? (
          <p className="mt-0.5 text-xs text-gray-600">{toast.description}</p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => {
          setIsVisible(false);
          setTimeout(() => onClose(toast.id), 300);
        }}
        className="flex size-5 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-black/5 hover:text-gray-600"
        aria-label="Kapat"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
