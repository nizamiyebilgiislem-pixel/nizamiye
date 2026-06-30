import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4">
      <div className="text-center">
        <p className="text-6xl font-bold text-[#093657]">404</p>
        <h2 className="mt-4 text-lg font-semibold text-[#093657]">Sayfa bulunamadı</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Aradığınız sayfa mevcut değil veya kaldırılmış olabilir.
        </p>
      </div>
      <Link
        href="/dashboard"
        className="inline-flex items-center rounded-md bg-[#093657] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#072a4a]"
      >
        Ana Sayfaya Dön
      </Link>
    </div>
  );
}
