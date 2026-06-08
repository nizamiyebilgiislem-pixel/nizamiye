"use client";

import { Download, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type StudentAvatarProps = {
  name: string;
  photoUrl?: string | null;
  size?: "default" | "sm" | "lg";
  previewable?: boolean;
};

export function StudentAvatar({ name, photoUrl, size = "default", previewable = false }: StudentAvatarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const avatar = (
    <Avatar size={size} className="rounded-md">
      {photoUrl ? <AvatarImage src={photoUrl} alt={name} /> : null}
      <AvatarFallback className="rounded-md bg-secondary text-secondary-foreground">{getInitials(name)}</AvatarFallback>
    </Avatar>
  );

  if (!previewable || !photoUrl) {
    return avatar;
  }

  return (
    <>
      <button
        type="button"
        className="rounded-md outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        onClick={() => setIsOpen(true)}
        aria-label={`${name} fotoğrafını büyüt`}
      >
        {avatar}
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#061827]/80 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-2xl overflow-hidden rounded-md border border-border bg-white shadow-xl">
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#093657]">{name}</p>
                <p className="text-xs text-muted-foreground">Talebe fotoğrafı</p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={photoUrl}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex size-9 items-center justify-center rounded-md border border-border bg-white text-[#093657] shadow-sm hover:bg-[#f4f8fc]"
                  aria-label="Fotoğrafı indir"
                >
                  <Download className="size-4" aria-hidden="true" />
                </a>
                <button
                  type="button"
                  className="inline-flex size-9 items-center justify-center rounded-md border border-border bg-white text-[#093657] shadow-sm hover:bg-[#f4f8fc]"
                  onClick={() => setIsOpen(false)}
                  aria-label="Fotoğraf önizlemesini kapat"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>
            </div>
            <div className="flex max-h-[75vh] items-center justify-center bg-[#f8fafc] p-4">
              <Image
                src={photoUrl}
                alt={name}
                width={900}
                height={900}
                unoptimized
                className="max-h-[70vh] w-auto max-w-full rounded-md object-contain shadow-sm"
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase("tr-TR"))
    .join("");
}
