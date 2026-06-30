

import { EmptyState } from "@/components/ui/empty-state";
import { ReportPrintActions } from "@/components/reports/report-print-actions";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth";
import { getRequestReportData } from "@/lib/reports/queries";
import { canViewRequestReports } from "@/lib/reports/permissions";

const statusLabels: Record<string, string> = {
  open: "Açık",
  in_progress: "İşlemde",
  resolved: "Çözüldü",
  closed: "Kapalı",
};

const priorityLabels: Record<string, string> = {
  low: "Düşük",
  medium: "Orta",
  high: "Yüksek",
  urgent: "Acil",
};

export default async function RequestReportsPage() {
  const { profile } = await requireAuth();

  if (!canViewRequestReports(profile)) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Raporlar" title="Talep Raporları" description="Yetkisiz erişim" />
        <Card><CardContent className="p-5 text-center text-sm text-muted-foreground">Bu raporu görüntüleme yetkiniz bulunmamaktadır.</CardContent></Card>
      </div>
    );
  }

  const reportData = await getRequestReportData(profile);

  const statusCounts: Record<string, number> = {};
  const priorityCounts: Record<string, number> = {};

  for (const req of reportData) {
    statusCounts[req.status] = (statusCounts[req.status] ?? 0) + 1;
    priorityCounts[req.priority] = (priorityCounts[req.priority] ?? 0) + 1;
  }

  return (
    <div className="space-y-6">
      <ReportPrintActions />
      <PageHeader eyebrow="Raporlar" title="Talep Raporları" description="Birim bazlı, durum bazlı ve öncelik bazlı talep analizleri." />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Object.entries(statusCounts).map(([status, count]) => (
          <Card key={status} size="sm" className="bg-white">
            <CardContent className="p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{statusLabels[status] ?? status}</p>
              <p className="mt-2 text-2xl font-semibold text-[#093657]">{count}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {reportData.length > 0 ? (
        <Card>
          <CardContent className="space-y-3 p-4">
            <h2 className="text-sm font-semibold text-[#093657]">Talep Listesi</h2>
            {reportData.slice(0, 20).map((req) => (
              <div key={req.id} className="flex items-center justify-between rounded-md border border-border bg-[#f8fafc] p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[#093657]">{req.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {req.created_by_profile?.full_name ?? "Bilinmiyor"} · {new Date(req.created_at).toLocaleDateString("tr-TR")}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant="outline">{priorityLabels[req.priority] ?? req.priority}</Badge>
                  <Badge variant={req.status === "resolved" || req.status === "closed" ? "default" : "secondary"}>
                    {statusLabels[req.status] ?? req.status}
                  </Badge>
                </div>
              </div>
            ))}
            {reportData.length > 20 && (
              <p className="text-xs text-muted-foreground">+ {reportData.length - 20} talep daha</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <EmptyState title="Talep bulunamadı." />
      )}
    </div>
  );
}
