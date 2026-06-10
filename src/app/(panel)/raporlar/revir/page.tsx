import { PageHeader } from "@/components/layout/page-header";
import { ReportShortcutCard } from "@/components/reports/report-shortcut-card";
import { Card, CardContent } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth";
import { getInfirmaryDashboardSummary } from "@/lib/infirmary/queries";

export default async function InfirmaryReportsPage() {
  const { profile } = await requireAuth();
  const summary = await getInfirmaryDashboardSummary(profile);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Raporlar" title="Revir Geçmişi" description="Sağlık kayıtları ve geçmiş işlemleri PDF olarak arşivleyin." />

      <Card size="sm">
        <CardContent className="grid gap-3 p-4 md:grid-cols-4">
          <Metric label="Toplam kayıt" value={summary.totalCount} />
          <Metric label="Bugün" value={summary.todayCount} />
          <Metric label="Sevk" value={summary.hospitalCount} />
          <Metric label="Bilgilendirilen veli" value={summary.parentInformedCount} />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ReportShortcutCard title="Sınıf Revir Özeti" description="Sınıf bazlı sağlık kayıtları." href="/raporlar/siniflar" badge="Sınıf" />
        <ReportShortcutCard title="Dönem Sonu Akademik Rapor" description="Revir kayıtları dönem sonu özetine dahil edilir." href="/raporlar/donem-sonu" badge="Dönem" />
      </div>

      <Card>
        <CardContent className="space-y-3 p-4">
          <h2 className="text-base font-semibold text-[#093657]">PDF Merkezi</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Revir PDF&apos;i talebe detayındaki <strong>Revir PDF</strong> butonundan açılabilir.
          </p>
        </CardContent>
      </Card>
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
