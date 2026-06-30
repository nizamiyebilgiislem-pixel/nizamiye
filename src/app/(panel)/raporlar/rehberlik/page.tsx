

import { EmptyState } from "@/components/ui/empty-state";
import { ReportPrintActions } from "@/components/reports/report-print-actions";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth";
import { getGuidanceDashboardData, getRecentInterviews, getUpcomingFollowUps } from "@/lib/guidance/queries";
import { canViewGuidanceReports } from "@/lib/reports/permissions";

export default async function GuidanceReportsPage() {
  const { profile } = await requireAuth();

  if (!canViewGuidanceReports(profile)) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Raporlar" title="Rehberlik Raporları" description="Yetkisiz erişim" />
        <Card><CardContent className="p-5 text-center text-sm text-muted-foreground">Bu raporu görüntüleme yetkiniz bulunmamaktadır.</CardContent></Card>
      </div>
    );
  }

  const [dashboard, recentInterviews, upcomingFollowUps] = await Promise.all([
    getGuidanceDashboardData(profile),
    getRecentInterviews(profile, 5),
    getUpcomingFollowUps(profile, 5),
  ]);

  return (
    <div className="space-y-6">
      <ReportPrintActions />
      <PageHeader eyebrow="Raporlar" title="Rehberlik Raporları" description="Açık rehberlik kayıtları, takip bekleyenler ve görüşme dağılımları." />

      <Card size="sm">
        <CardContent className="grid gap-3 p-4 md:grid-cols-4">
          <Metric label="Toplam Görüşme" value={dashboard.total_interviews} />
          <Metric label="Açık Takip" value={dashboard.open_follow_ups} />
          <Metric label="Yaklaşan Takip" value={dashboard.upcoming_follow_ups} />
          <Metric label="Aktif Anket" value={dashboard.active_surveys} />
        </CardContent>
      </Card>

      {recentInterviews.length > 0 && (
        <Card>
          <CardContent className="space-y-3 p-4">
            <h2 className="text-sm font-semibold text-[#093657]">Son Görüşmeler</h2>
            {recentInterviews.map((interview) => (
              <div key={interview.id} className="flex items-center justify-between rounded-md border border-border bg-[#f8fafc] p-3">
                <div>
                  <p className="text-sm font-medium text-[#093657]">{interview.student?.full_name ?? "Öğrenci"}</p>
                  <p className="text-xs text-muted-foreground">
                    {interview.interview_type} · {new Date(interview.interview_date).toLocaleDateString("tr-TR")}
                  </p>
                </div>
                <Badge variant={interview.status === "closed" ? "default" : "outline"}>
                  {interview.status === "closed" ? "Tamamlandı" : interview.status === "followed" ? "Takip Edildi" : "Açık"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {upcomingFollowUps.length > 0 && (
        <Card>
          <CardContent className="space-y-3 p-4">
            <h2 className="text-sm font-semibold text-[#093657]">Yaklaşan Takipler</h2>
            {upcomingFollowUps.map((followUp) => (
              <div key={followUp.id} className="flex items-center justify-between rounded-md border border-border bg-[#f8fafc] p-3">
                <div>
                  <p className="text-sm font-medium text-[#093657]">{followUp.student?.full_name ?? "Öğrenci"}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(followUp.follow_up_date).toLocaleDateString("tr-TR")}
                  </p>
                </div>
                <Badge variant={followUp.status === "completed" ? "default" : "outline"}>
                  {followUp.status === "completed" ? "Tamamlandı" : followUp.status === "cancelled" ? "İptal" : "Planlandı"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {recentInterviews.length === 0 && upcomingFollowUps.length === 0 && (
        <EmptyState title="Rehberlik verisi bulunamadı." />
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
