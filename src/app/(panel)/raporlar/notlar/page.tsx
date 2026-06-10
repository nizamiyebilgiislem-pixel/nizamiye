import { PageHeader } from "@/components/layout/page-header";
import { ReportShortcutCard } from "@/components/reports/report-shortcut-card";
import { Card, CardContent } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth";
import { getGradeDashboardSummary } from "@/lib/grades/queries";
import { getActiveTerms } from "@/lib/terms/queries";

export default async function GradeReportsPage() {
  const { profile } = await requireAuth();
  const [summary, activeTerms] = await Promise.all([getGradeDashboardSummary(profile), getActiveTerms()]);
  const activeTerm = activeTerms[0] ?? null;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Raporlar" title="Not Dökümleri" description="Dönem, ders ve başarı özetlerini PDF formatında alın." />

      <Card size="sm">
        <CardContent className="grid gap-3 p-4 md:grid-cols-3">
          <Metric label="Aktif dönem" value={activeTerm?.name ?? "Yok"} />
          <Metric label="Aktif ders" value={summary.activeCourseCount} />
          <Metric label="Not kaydı" value={summary.gradeCount} />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ReportShortcutCard title="Sınıf Başarı Özeti" description="Sınıf bazlı genel başarı görünümü." href="/raporlar/siniflar" badge="Sınıf" />
        <ReportShortcutCard title="Dönem Sonu Akademik Rapor" description="Başarı ve devamsızlık odaklı resmi çıktı." href="/raporlar/donem-sonu" badge="Dönem" />
      </div>

      <Card>
        <CardContent className="space-y-3 p-4">
          <h2 className="text-base font-semibold text-[#093657]">PDF İpuçları</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Not dökümü PDF&apos;i talebe detayındaki <strong>Not Dökümü PDF</strong> butonundan açılır.
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
