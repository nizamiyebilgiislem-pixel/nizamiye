"use client";

export default function GlobalError({
  _error,
  reset,
}: {
  _error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="tr">
      <body className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#f6f8fa] px-4">
        <div className="text-center">
          <p className="text-6xl font-bold text-[#093657]">500</p>
          <h2 className="mt-4 text-lg font-semibold text-[#093657]">Beklenmeyen bir hata oluştu</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Lütfen daha sonra tekrar deneyiniz. Sorun devam ederse sistem yöneticinize başvurun.
          </p>
        </div>
        <button
          onClick={reset}
          className="inline-flex items-center rounded-md bg-[#093657] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#072a4a]"
        >
          Tekrar Dene
        </button>
      </body>
    </html>
  );
}
