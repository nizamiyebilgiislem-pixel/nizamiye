import Link from "next/link";

import { ReportEmptyState } from "@/components/reports/report-filter-panel";
import { ReportPrintActions } from "@/components/reports/report-print-actions";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth";
import { getDocumentsDashboardSummary } from "@/lib/documents/queries";
import { getDocumentReportData } from "@/lib/reports/queries";
import { canViewDocumentReports } from "@/lib/reports/permissions";

export default async function DocumentReportsPage() {
  const { profile } = await requireAuth();

  if (!canViewDocumentReports(profile)) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Raporlar" title="Evrak Raporları" description="Yetkisiz erişim" />
        <Card><CardContent className="p-5 text-center text-sm text-muted-foreground">Bu raporu görüntüleme yetkiniz bulunmamaktadır.</CardContent></Card>
      </div>
    );
  }

  const [summary, reportData] = await Promise.all([
    getDocumentsDashboardSummary(profile),
    getDocumentReportData(),
  ]);

  return (
    <div className="space-y-6">
      <ReportPrintActions />
      <PageHeader eyebrow="Raporlar" title="Evrak Raporları" description="Evrak listesi, öğrenci bazlı evraklar, eksik evrak ve tarih aralığı raporları." />

      <Card size="sm">
        <CardContent className="grid gap-3 p-4 md:grid-cols-3">
          <Metric label="Toplam Evrak" value={summary.totalCount} />
          <Metric label="Bu Ay Eklenen" value={summary.currentMonthCount} />
          <Metric label="Eksik Evraklı Öğrenci" value={summary.missingDocumentStudentCount} />
        </CardContent>
      </Card>

      {summary.typeCounts.length > 0 && (
        <Card>
          <CardContent className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
            <h2 className="col-span-full text-sm font-semibold text-[#093657]">Evrak Türlerine Göre Dağılım</h2>
            {summary.typeCounts.map((item) => (
              <div key={item.type} className="rounded-md border border-border bg-[#f8fafc] p-3">
                <p className="text-xs text-muted-foreground">{item.type}</p>
                <p className="mt-1 text-lg font-semibold text-[#093657]">{item.count}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {reportData.length > 0 ? (
        <Card>
          <CardContent className="space-y-3 p-4">
            <h2 className="text-sm font-semibold text-[#093657]">Son Evraklar</h2>
            {reportData.slice(0, 20).map((doc) => (
              <div key={doc.id} className="flex items-center justify-between rounded-md border border-border bg-[#f8fafc] p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[#093657]">{doc.student_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {doc.type} · {doc.student_department ?? "Bölüm yok"} · {new Date(doc.created_at).toLocaleDateString("tr-TR")}
                  </p>
                </div>
                <Link href={doc.url} target="_blank" rel="noreferrer" className="shrink-0 text-xs font-medium text-[#093657] hover:underline">
                  Görüntüle
                </Link>
              </div>
            ))}
            {reportData.length > 20 && (
              <p className="text-xs text-muted-foreground">+ {reportData.length - 20} evrak daha</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <ReportEmptyState message="Evrak bulunamadı." />
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
