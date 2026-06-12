"use client";

import { Button } from "@/components/ui/button";

export default function SystemError({
  _error,
  reset,
}: {
  _error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-[#093657]">Sistem sayfası yüklenemedi</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Sistem işlemleri yüklenirken beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.
        </p>
      </div>
      <Button onClick={reset} variant="default">
        Tekrar Dene
      </Button>
    </div>
  );
}
