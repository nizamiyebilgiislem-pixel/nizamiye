"use client";

import { Button } from "@/components/ui/button";

export default function DuyurularError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-[#093657]">Bir hata oluştu</h2>
        <p className="text-sm text-muted-foreground">Duyurular yüklenirken bir hata oluştu.</p>
        {error && (
          <details className="mx-auto mt-4 max-w-lg rounded-md border border-red-200 bg-red-50 p-3 text-left">
            <summary className="cursor-pointer text-xs font-medium text-red-700">Hata detayı</summary>
            <pre className="mt-2 whitespace-pre-wrap text-xs text-red-600">{error.message}</pre>
          </details>
        )}
      </div>
      <Button onClick={() => reset()}>Tekrar Dene</Button>
    </div>
  );
}
