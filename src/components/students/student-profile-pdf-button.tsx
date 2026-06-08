"use client";

import type React from "react";
import { Download } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function StudentProfilePdfButton({ fileName }: { fileName: string }) {
  function handlePrint(event: React.MouseEvent<HTMLButtonElement>) {
    const printArea = event.currentTarget.closest(".student-profile-print-area");
    const previousTitle = document.title;

    if (printArea instanceof HTMLElement) {
      printArea.dataset.printActive = "true";
    }

    function cleanup() {
      document.title = previousTitle;
      if (printArea instanceof HTMLElement) {
        delete printArea.dataset.printActive;
      }
      window.removeEventListener("afterprint", cleanup);
    }

    window.addEventListener("afterprint", cleanup);
    document.title = sanitizeFileName(fileName);
    window.print();
    window.setTimeout(cleanup, 2000);
  }

  return (
    <button type="button" onClick={handlePrint} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "student-profile-print-hidden")}>
      <Download className="size-4" aria-hidden />
      PDF İndir
    </button>
  );
}

function sanitizeFileName(value: string) {
  return value
    .trim()
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, "-")
    .slice(0, 80) || "talebe-profili";
}
