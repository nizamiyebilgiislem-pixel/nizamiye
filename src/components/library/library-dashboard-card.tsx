import Link from "next/link";
import { BookOpen } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type LibraryDashboardCardProps = {
  totalBooks: number;
  totalCopies: number;
  availableCopies: number;
  borrowedCount: number;
  overdueCount: number;
  totalDocuments: number;
};

export function LibraryDashboardCard({
  totalBooks,
  totalCopies,
  availableCopies,
  borrowedCount,
  overdueCount,
  totalDocuments,
}: LibraryDashboardCardProps) {
  return (
    <Link href="/kutuphane" className="block">
      <Card className="h-full border-[#e5e7eb] bg-white transition-shadow hover:shadow-md">
        <CardHeader className="flex flex-row items-center gap-3 border-b border-border pb-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-[#eaf1f6]">
            <BookOpen className="size-5 text-[#093657]" aria-hidden />
          </div>
          <div>
            <CardTitle className="text-sm">Kütüphane Özeti</CardTitle>
            <CardDescription className="text-xs">{totalBooks} kitap</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 p-4">
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <p className="text-muted-foreground">Toplam Nüsha</p>
              <p className="mt-0.5 text-base font-semibold text-[#093657]">{totalCopies}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Mevcut</p>
              <p className="mt-0.5 text-base font-semibold text-[#093657]">{availableCopies}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Emanette</p>
              <p className="mt-0.5 text-base font-semibold text-[#093657]">{borrowedCount}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            {overdueCount > 0 && (
              <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700">
                {overdueCount} geciken emanet
              </span>
            )}
            {totalDocuments > 0 && (
              <span className="inline-flex items-center rounded-md bg-[#eaf1f6] px-2 py-1 text-xs font-medium text-[#093657]">
                {totalDocuments} doküman
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
