"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <AlertTriangle className="size-12 text-red-500" />
      <h2 className="text-lg font-semibold text-[#093657]">Bir hata oluştu</h2>
      <p className="text-sm text-muted-foreground">Canlı oturumlar yüklenirken bir hata oluştu.</p>
      <Button onClick={() => reset()}>Tekrar Dene</Button>
    </div>
  );
}
