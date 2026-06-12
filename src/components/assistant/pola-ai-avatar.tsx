"use client";

import Image from "next/image";

import { cn } from "@/lib/utils";

type PolaAiAvatarProps = {
  size?: number;
  className?: string;
  priority?: boolean;
};

export function PolaAiAvatar({ size = 56, className, priority = false }: PolaAiAvatarProps) {
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full border border-white/70 bg-white shadow-[0_10px_30px_rgba(9,54,87,0.18)]",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Image
        src="/polaai (1).png"
        alt="Pola AI avatarı"
        fill
        sizes={`${size}px`}
        priority={priority}
        className="object-cover"
      />
    </div>
  );
}
