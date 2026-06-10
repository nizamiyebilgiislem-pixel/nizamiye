import Link from "next/link";
import { ClipboardList } from "lucide-react";

import { EvaluationErrorMessage } from "@/components/evaluations/evaluation-error-message";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth";
import { getEvaluationDashboardSummary } from "@/lib/evaluations/queries";
import { cn } from "@/lib/utils";

type EvaluationsDashboardPageProps = { searchParams: Promise<{ error?: string }> };

export default async function EvaluationsDashboardPage({ searchParams }: EvaluationsDashboardPageProps) {
  const params = await searchParams;
  const { profile } = await requireAuth();
  const summary = await getEvaluationDashboardSummary(profile);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Kanaat Sistemi" title="Kanaat Sistemi" description="Talebe dönem değerlendirmelerini takip edin." />
      <EvaluationErrorMessage error={params.error} />
      <section className="grid gap-4 md:grid-cols-3">
        <Metric label="Toplam Kanaat Kaydı" value={summary.totalEvaluationCount} />
        <Metric label="Aktif Dönem Kanaat Kaydı" value={summary.activeTermEvaluationCount} />
        <Metric label="Eksik Kanaat Talebe" value={summary.missingActiveStudentCount} />
      </section>
      <Card>
        <CardHeader><CardTitle>Bölümlere Göre Kanaat Sayısı</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {summary.departmentEvaluationCounts.map((item) => (
            <div key={item.departmentName} className="rounded-md border border-border bg-background p-3">
              <p className="text-sm text-muted-foreground">{item.departmentName}</p>
              <p className="mt-1 text-2xl font-semibold">{item.count}</p>
            </div>
          ))}
        </CardContent>
      </Card>
      {profile.role !== "destek_birim_muduru" ? (
        <Link href="/kanaat-sistemi/kanaat-girisi" className={cn(buttonVariants())}>
          <ClipboardList className="size-4" aria-hidden="true" />
          Kanaat Girişi
        </Link>
      ) : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-2 text-3xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
