"use client";

import { Button } from "@/components/ui/button";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <h2 className="text-lg font-semibold text-[#093657]">Bir hata oluþtu</h2>
      <p className="text-sm text-muted-foreground">Veliler yüklenirken bir hata oluþtu.</p>
      <Button onClick={() => reset()}>Tekrar Dene</Button>
    </div>
  );
}