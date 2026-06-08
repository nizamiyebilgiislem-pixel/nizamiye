import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { ReportShortcutCard } from "@/components/reports/report-shortcut-card";
import { Card, CardContent } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth";
import { getEvaluationDashboardSummary } from "@/lib/evaluations/queries";
import { getActiveTerms } from "@/lib/terms/queries";

export default async function EvaluationReportsPage() {
  const { profile } = await requireAuth();
  const [summary, activeTerms] = await Promise.all([getEvaluationDashboardSummary(profile), getActiveTerms()]);
  const activeTerm = activeTerms[0] ?? null;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Raporlar" title="Kanaat Raporları" description="Kanaat kayıtları ve öğretmen yorumlarını PDF olarak alın." />

      <Card size="sm">
        <CardContent className="grid gap-3 p-4 md:grid-cols-3">
          <Metric label="Aktif dönem" value={activeTerm?.name ?? "Yok"} />
          <Metric label="Kanaat kaydı" value={summary.totalEvaluationCount} />
          <Metric label="Eksik öğrenciler" value={summary.missingActiveStudentCount} />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ReportShortcutCard title="Talebe Kanaat PDF" description="Bir talebenin kanaat geçmişi." href="/raporlar/talebeler" badge="Bireysel" />
        <ReportShortcutCard title="Sınıf Kanaat Özeti" description="Sınıf bazlı kanaat ve yorum görünümü." href="/raporlar/siniflar" badge="Sınıf" />
        <ReportShortcutCard title="Dönem Sonu Akademik Rapor" description="Kanaat özeti dönem sonu raporuna dahil edilir." href="/raporlar/donem-sonu" badge="Dönem" />
      </div>

      <Card>
        <CardContent className="space-y-3 p-4">
          <h2 className="text-base font-semibold text-[#093657]">PDF Merkezi</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Kanaat PDF&apos;i talebe detayındaki <strong>Kanaat PDF</strong> butonundan açılabilir.
          </p>
          <Link href="/raporlar/talebeler" className="text-sm font-medium text-[#093657] hover:underline">
            PDF Merkezi&apos;ne git
          </Link>
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
