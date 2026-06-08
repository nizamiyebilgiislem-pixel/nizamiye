"use client";

import { Printer } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PdfPrintButton({ label = "Yazdır / PDF İndir", className }: { label?: string; className?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className={cn(buttonVariants({ variant: "outline", size: "sm" }), className)}>
      <Printer className="size-4" aria-hidden="true" />
      {label}
    </button>
  );
}
