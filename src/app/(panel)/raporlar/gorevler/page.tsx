

import { ReportEmptyState } from "@/components/reports/report-filter-panel";
import { ReportPrintActions } from "@/components/reports/report-print-actions";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth";
import { getTaskCounts } from "@/lib/tasks/queries";
import { getTaskReportData } from "@/lib/reports/queries";
import { canViewTaskReports } from "@/lib/reports/permissions";

export default async function TaskReportsPage() {
  const { profile } = await requireAuth();

  if (!canViewTaskReports(profile)) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Raporlar" title="Görev Raporları" description="Yetkisiz erişim" />
        <Card><CardContent className="p-5 text-center text-sm text-muted-foreground">Bu raporu görüntüleme yetkiniz bulunmamaktadır.</CardContent></Card>
      </div>
    );
  }

  const [taskCounts, reportData] = await Promise.all([
    getTaskCounts(profile),
    getTaskReportData(profile),
  ]);

  const statusLabels: Record<string, string> = {
    pending: "Bekliyor",
    in_progress: "Devam Ediyor",
    completed: "Tamamlandı",
    cancelled: "İptal",
  };

  return (
    <div className="space-y-6">
      <ReportPrintActions />
      <PageHeader eyebrow="Raporlar" title="Görev Raporları" description="Açık, tamamlanan ve geciken görevlerin durum bazlı özeti." />

      <Card size="sm">
        <CardContent className="grid gap-3 p-4 md:grid-cols-4">
          <Metric label="Toplam Görev" value={taskCounts.total} />
          <Metric label="Açık Görev" value={taskCounts.pending + taskCounts.in_progress} />
          <Metric label="Tamamlanan" value={taskCounts.completed} />
          <Metric label="Geciken" value={taskCounts.overdue} />
        </CardContent>
      </Card>

      {reportData.length > 0 ? (
        <Card>
          <CardContent className="space-y-3 p-4">
            <h2 className="text-sm font-semibold text-[#093657]">Görev Listesi</h2>
            {reportData.slice(0, 20).map(({ task, assignedTo }) => (
              <div key={task.id} className="flex items-center justify-between rounded-md border border-border bg-[#f8fafc] p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[#093657]">{task.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {assignedTo?.full_name ?? "Atanmamış"} · {task.created_at ? new Date(task.created_at).toLocaleDateString("tr-TR") : ""}
                  </p>
                </div>
                <Badge variant={task.status === "completed" ? "default" : task.status === "cancelled" ? "outline" : "secondary"}>
                  {statusLabels[task.status] ?? task.status}
                </Badge>
              </div>
            ))}
            {reportData.length > 20 && (
              <p className="text-xs text-muted-foreground">+ {reportData.length - 20} görev daha</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <ReportEmptyState message="Görev bulunamadı." />
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
