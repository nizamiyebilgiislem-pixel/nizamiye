"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type PhotoUploadFieldProps = {
  label: string;
  name: string;
  displayName?: string;
  initialPhotoUrl?: string | null;
  helperText?: string;
  className?: string;
};

export function PhotoUploadField({
  label,
  name,
  displayName,
  initialPhotoUrl,
  helperText = "JPEG, PNG veya WebP. En fazla 3 MB.",
  className,
}: PhotoUploadFieldProps) {
  const [selectedPreviewUrl, setSelectedPreviewUrl] = useState<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const initials = useMemo(() => getInitials(displayName), [displayName]);
  const previewUrl = selectedPreviewUrl ?? initialPhotoUrl ?? null;

  return (
    <label className={cn("grid gap-2 text-sm font-medium", className)}>
      {label}
      <div className="flex flex-col gap-3 rounded-md border border-border bg-background p-3 sm:flex-row sm:items-center">
        <Avatar className="size-16 rounded-md">
          {previewUrl ? <AvatarImage src={previewUrl} alt={displayName ?? label} /> : null}
          <AvatarFallback className="rounded-md bg-secondary text-secondary-foreground">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <input
            type="file"
            name={name}
            accept="image/jpeg,image/png,image/webp"
            className="block w-full text-sm file:mr-4 file:h-9 file:rounded-md file:border-0 file:bg-primary file:px-3 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/80"
            onChange={(event) => {
              const file = event.target.files?.[0];

              if (!file) {
                if (objectUrlRef.current) {
                  URL.revokeObjectURL(objectUrlRef.current);
                }

                objectUrlRef.current = null;
                setSelectedPreviewUrl(null);
                return;
              }

              const nextObjectUrl = URL.createObjectURL(file);

              if (objectUrlRef.current) {
                URL.revokeObjectURL(objectUrlRef.current);
              }

              objectUrlRef.current = nextObjectUrl;
              setSelectedPreviewUrl(nextObjectUrl);
            }}
          />
          <p className="mt-2 text-xs text-muted-foreground">{helperText}</p>
        </div>
      </div>
    </label>
  );
}

function getInitials(value?: string) {
  if (!value) {
    return "Foto";
  }

  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase("tr-TR"))
    .join("");
}
