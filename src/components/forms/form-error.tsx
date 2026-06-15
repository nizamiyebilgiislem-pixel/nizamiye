"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

type FormErrorProps = {
  message: string;
  className?: string;
};

export function FormError({ message, className }: FormErrorProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (message && ref.current) {
      ref.current.classList.remove("animate-shake");
      void ref.current.offsetWidth;
      ref.current.classList.add("animate-shake");
    }
  }, [message]);

  if (!message) return null;

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700",
        className,
      )}
    >
      {message}
    </div>
  );
}