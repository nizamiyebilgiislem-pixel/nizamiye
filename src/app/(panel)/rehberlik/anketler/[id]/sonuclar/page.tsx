import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth";
import { canViewGuidance } from "@/lib/guidance/permissions";
import { getSurveyResults } from "@/lib/guidance/queries";
import { logPdfGenerated } from "@/lib/reports/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PrintableReportShell } from "@/components/reports/printable-report-shell";
import { PdfPrintButton } from "@/components/reports/pdf-print-button";
import { PieChart } from "@/components/guidance/pie-chart";

const typeLabels: Record<string, string> = { scale: "1-5 Ölçek", choice: "Çoktan Seçmeli", yes_no: "Evet/Hayır", text: "Kısa Metin" };

export default async function AnketSonuclarPage({ params }: { params: Promise<{ id: string }> }) {
  const { profile } = await requireAuth();
  const { id } = await params;

  if (!canViewGuidance(profile)) {
    return <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Bu sayfaya erişim yetkiniz bulunmamaktadır.</div>;
  }

  const data = await getSurveyResults(id);
  if (!data) notFound();

  const { survey, totalResponses, results } = data;

  await logPdfGenerated(profile, {
    reportType: "survey_results",
    entityType: "guidance_survey",
    entityId: id,
    title: `${survey.title} - Anket Sonuçları`,
    description: `${totalResponses} katılımcı, ${results.length} soru`,
  });

  return (
    <PrintableReportShell
      title={survey.title}
      subtitle="Anket Sonuçları"
      backHref={`/rehberlik/anketler/${id}`}
      backLabel="Ankete Dön"
      meta={
        <div className="flex gap-2">
          <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium">{totalResponses} katılımcı</span>
          <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium">{results.length} soru</span>
        </div>
      }
    >
      <div className="print:hidden">
        <PageHeader eyebrow="Rehberlik" title={`${survey.title} — Sonuçlar`} description={`${totalResponses} katılımcı`} actions={<PdfPrintButton />} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-2">
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground font-medium">Toplam Cevap</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold text-[#093657]">{totalResponses}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground font-medium">Soru Sayısı</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold text-[#093657]">{results.length}</p></CardContent></Card>
      </div>

      <div className="space-y-4">
        {results.map(({ question, result }) => {
          const pieData: { label: string; value: number }[] = [];

          if (question.question_type === "scale") {
            const dist = result.distribution as Record<number, number> | undefined;
            if (dist) {
              for (let n = 1; n <= 5; n++) {
                pieData.push({ label: `${n} puan`, value: dist[n] ?? 0 });
              }
            }
          } else if (question.question_type === "yes_no") {
            const r = result as { yes: number; no: number };
            pieData.push({ label: "Evet", value: r.yes });
            pieData.push({ label: "Hayır", value: r.no });
          } else if (question.question_type === "choice") {
            const counts = (result as { counts: Record<string, number> }).counts;
            for (const [opt, count] of Object.entries(counts)) {
              pieData.push({ label: opt, value: count });
            }
          }

          return (
            <Card key={question.id}>
              <CardHeader>
                <CardTitle className="text-sm">{question.question_text}</CardTitle>
                <p className="text-xs text-muted-foreground">{typeLabels[question.question_type]}</p>
              </CardHeader>
              <CardContent>
                {question.question_type === "scale" && (
                  <div className="space-y-4">
                    <p className="text-sm">Ortalama: <strong>{(result.average as number)?.toFixed(1) ?? "—"}</strong> ({result.count as number} cevap)</p>
                    <div className="flex flex-wrap gap-6">
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((n) => {
                          const dist = result.distribution as Record<number, number> | undefined;
                          const count = dist?.[n] ?? 0;
                          const maxCount = Math.max(...Object.values(dist ?? {}), 1);
                          return (
                            <div key={n} className="flex flex-1 flex-col items-center gap-1">
                              <span className="text-xs text-muted-foreground">{count}</span>
                              <div className="flex w-full items-end justify-center" style={{ height: 60 }}>
                                <div className="w-full rounded-t bg-[#093657] transition-all" style={{ height: `${(count / maxCount) * 100}%`, minHeight: count > 0 ? 4 : 0 }} />
                              </div>
                              <span className="text-xs font-medium">{n}</span>
                            </div>
                          );
                        })}
                      </div>
                      {pieData.length > 0 && <PieChart data={pieData} size={140} />}
                    </div>
                  </div>
                )}
                {question.question_type === "yes_no" && (
                  <div className="flex flex-wrap gap-6">
                    <div className="flex gap-6 items-center">
                      <div><span className="text-sm font-medium text-green-700">Evet:</span> <span className="text-lg font-semibold">{(result as { yes: number }).yes}</span></div>
                      <div><span className="text-sm font-medium text-red-700">Hayır:</span> <span className="text-lg font-semibold">{(result as { no: number }).no}</span></div>
                      <div><span className="text-sm text-muted-foreground">Toplam: {(result as { total: number }).total}</span></div>
                    </div>
                    <PieChart data={pieData} size={140} />
                  </div>
                )}
                {question.question_type === "choice" && (
                  <div className="flex flex-wrap gap-6">
                    <div className="space-y-1">
                      {Object.entries((result as { counts: Record<string, number> }).counts).map(([opt, count]) => (
                        <div key={opt} className="flex items-center gap-2">
                          <span className="text-sm">{opt}:</span>
                          <span className="text-sm font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                    {pieData.length > 0 && <PieChart data={pieData} size={140} />}
                  </div>
                )}
                {question.question_type === "text" && (
                  <div className="space-y-1">
                    {(result as { answers: string[] }).answers.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Henüz metin cevabı yok.</p>
                    ) : (
                      (result as { answers: string[] }).answers.map((ans, i) => (
                        <p key={i} className="rounded-md bg-muted px-3 py-1.5 text-sm">{ans}</p>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </PrintableReportShell>
  );
}
