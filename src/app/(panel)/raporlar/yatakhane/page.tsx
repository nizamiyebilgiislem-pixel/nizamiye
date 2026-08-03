

import { EmptyState } from "@/components/ui/empty-state";
import { ReportPrintActions } from "@/components/reports/report-print-actions";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth";
import { getDormitoryDashboardData } from "@/lib/dormitory/queries";
import { getDormitoryReportData } from "@/lib/reports/queries";
import { canViewDormitoryReports } from "@/lib/reports/permissions";

export default async function DormitoryReportsPage() {
  const { profile } = await requireAuth();

  if (!canViewDormitoryReports(profile)) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Raporlar" title="Yatakhane Raporları" description="Yetkisiz erişim" />
        <Card><CardContent className="p-5 text-center text-sm text-muted-foreground">Bu raporu görüntüleme yetkiniz bulunmamaktadır.</CardContent></Card>
      </div>
    );
  }

  const [dashboard, reportData] = await Promise.all([
    getDormitoryDashboardData(profile),
    getDormitoryReportData(profile),
  ]);

  return (
    <div className="space-y-6">
      <ReportPrintActions />
      <PageHeader eyebrow="Raporlar" title="Yatakhane Raporları" description="Yatakhane doluluk, boş kapasite ve öğrenci yerleşim planı." />

      <Card size="sm">
        <CardContent className="grid gap-3 p-4 md:grid-cols-4">
          <Metric label="Toplam Yatakhane" value={dashboard.totalDormitories} />
          <Metric label="Toplam Kapasite" value={dashboard.totalCapacity} />
          <Metric label="Yerleşen" value={dashboard.assignedCount} />
          <Metric label="Boş Kapasite" value={dashboard.availableCapacity} />
        </CardContent>
      </Card>

      {reportData.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-[#093657]">Oda Bazlı Doluluk</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {reportData.map(({ dormitory, studentCount, assignments }) => (
              <Card key={dormitory.id} className="bg-white">
                <CardHeader className="border-b border-border pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{dormitory.name}</CardTitle>
                    <Badge variant={studentCount >= (dormitory.capacity ?? 0) ? "outline" : "default"}>
                      {studentCount}/{dormitory.capacity ?? 0}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">
                    {dormitory.description ?? ""}
                  </p>
                  {assignments.length > 0 ? (
                    <ol className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
                      {assignments
                        .slice()
                        .sort((left, right) => (left.student?.full_name ?? "").localeCompare(right.student?.full_name ?? "", "tr"))
                        .map((assignment, index) => (
                          <li key={assignment.id} className="flex gap-2">
                            <span className="w-5 shrink-0 text-right text-muted-foreground">{index + 1}.</span>
                            <span className="font-medium text-[#093657]">{assignment.student?.full_name ?? "Bilinmeyen talebe"}</span>
                          </li>
                        ))}
                    </ol>
                  ) : (
                    <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">Bu yatakhanede aktif talebe bulunmuyor.</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState title="Yatakhane kaydı bulunamadı." />
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
