"use client";

import { Printer } from "lucide-react";

export function PrintScheduleButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-md border border-[#093657]/15 bg-white px-4 py-2 text-sm font-medium text-[#093657] shadow-sm hover:bg-[#f4f8fc]"
    >
      <Printer className="size-4" aria-hidden="true" />
      Yazdır / PDF Kaydet
    </button>
  );
}
