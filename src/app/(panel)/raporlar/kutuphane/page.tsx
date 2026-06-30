

import { EmptyState } from "@/components/ui/empty-state";
import { ReportPrintActions } from "@/components/reports/report-print-actions";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth";
import { getLibraryDashboardData, getCategoryBookCounts, getOverdueLoans } from "@/lib/library/queries";
import { canViewLibraryReports } from "@/lib/reports/permissions";

export default async function LibraryReportsPage() {
  const { profile } = await requireAuth();

  if (!canViewLibraryReports(profile)) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Raporlar" title="Kütüphane Raporları" description="Yetkisiz erişim" />
        <Card><CardContent className="p-5 text-center text-sm text-muted-foreground">Bu raporu görüntüleme yetkiniz bulunmamaktadır.</CardContent></Card>
      </div>
    );
  }

  const [dashboard, categoryCounts, overdueLoans] = await Promise.all([
    getLibraryDashboardData(),
    getCategoryBookCounts(),
    getOverdueLoans(10),
  ]);

  return (
    <div className="space-y-6">
      <ReportPrintActions />
      <PageHeader eyebrow="Raporlar" title="Kütüphane Raporları" description="Kitap listesi, emanet durumu ve geciken teslim raporları." />

      <Card size="sm">
        <CardContent className="grid gap-3 p-4 md:grid-cols-4">
          <Metric label="Toplam Kitap" value={dashboard.totalBooks} />
          <Metric label="Mevcut Kitap" value={dashboard.availableCopies} />
          <Metric label="Emanette" value={dashboard.borrowedCount} />
          <Metric label="Geciken" value={dashboard.overdueCount} />
        </CardContent>
      </Card>

      {categoryCounts.length > 0 && (
        <Card>
          <CardContent className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
            <h2 className="col-span-full text-sm font-semibold text-[#093657]">Kategorilere Göre Kitap Sayısı</h2>
            {categoryCounts.map((cat) => (
              <div key={cat.id} className="rounded-md border border-border bg-[#f8fafc] p-3">
                <p className="text-xs text-muted-foreground">{cat.name}</p>
                <p className="mt-1 text-lg font-semibold text-[#093657]">{cat.count}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {overdueLoans.length > 0 && (
        <Card>
          <CardContent className="space-y-3 p-4">
            <h2 className="text-sm font-semibold text-[#093657]">Geciken Emanetler</h2>
            {overdueLoans.map((loan) => (
              <div key={loan.id} className="flex items-center justify-between rounded-md border border-border bg-[#f8fafc] p-3">
                <div>
                  <p className="text-sm font-medium text-[#093657]">{loan.book?.title ?? "Kitap"}</p>
                  <p className="text-xs text-muted-foreground">{loan.student?.full_name ?? "Öğrenci"}</p>
                </div>
                <Badge variant="outline">Gecikmiş</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {overdueLoans.length === 0 && categoryCounts.length === 0 && (
        <EmptyState title="Kütüphane verisi bulunamadı." />
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md border border-border bg-[#f8fafc] p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold text-[#093657]">{value}</p>
    </div>
  );
}
