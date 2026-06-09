"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

import { Toast } from "@/components/toast/toast";
import type { ToastItem, ToastType } from "@/components/toast/toast";

type AddToastFn = (type: ToastType, title: string, description?: string, duration?: number) => void;

type ToastContextValue = {
  addToast: AddToastFn;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const addToast = useCallback<AddToastFn>((type, title, description, duration) => {
    idRef.current += 1;
    const id = String(idRef.current);
    setToasts((prev) => [...prev, { id, type, title, description, duration }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="pointer-events-none fixed inset-0 z-[999] flex items-start justify-end p-4 sm:p-6">
        <div className="pointer-events-auto flex w-full max-w-sm flex-col gap-3">
          {toasts.map((toast) => (
            <Toast key={toast.id} toast={toast} onClose={removeToast} />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}
