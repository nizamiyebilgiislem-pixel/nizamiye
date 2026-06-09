import { notFound } from "next/navigation";
import Link from "next/link";
import { Trash2 } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth";
import { canManageGuidance, canViewGuidance } from "@/lib/guidance/permissions";
import { getSurveyById } from "@/lib/guidance/queries";
import { deleteSurveyAction } from "@/lib/guidance/actions";
import { SurveyQuestionEditor } from "@/components/guidance/survey-question-editor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function AnketDetayPage({ params }: { params: Promise<{ id: string }> }) {
  const { profile } = await requireAuth();
  const { id } = await params;

  if (!canViewGuidance(profile)) {
    return <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Bu sayfaya erişim yetkiniz bulunmamaktadır.</div>;
  }

  const survey = await getSurveyById(id);
  if (!survey) notFound();

  const canManage = canManageGuidance(profile);
  const scopeLabels: Record<string, string> = { all_students: "Tüm Öğrenciler", department: "Bölüm", class: "Sınıf" };
  const statusLabels: Record<string, string> = { draft: "Taslak", active: "Aktif", closed: "Kapalı" };
  const statusColors: Record<string, "default" | "secondary" | "outline"> = { draft: "outline", active: "default", closed: "secondary" };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Rehberlik" title={survey.title} description={survey.description ?? ""} actions={canManage ? <div className="flex gap-2"><Link href={`/rehberlik/anketler/${id}/sonuclar`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>Sonuçlar</Link><form action={deleteSurveyAction.bind(null, id) as unknown as (formData: FormData) => void}><Button type="submit" variant="destructive" size="sm"><Trash2 className="mr-1.5 size-4" /> Sil</Button></form></div> : undefined} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground font-medium">Durum</CardTitle></CardHeader><CardContent><Badge variant={statusColors[survey.status] ?? "outline"}>{statusLabels[survey.status] ?? survey.status}</Badge></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground font-medium">Hedef</CardTitle></CardHeader><CardContent><p className="text-sm font-medium">{scopeLabels[survey.target_scope] ?? survey.target_scope}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground font-medium">Anonim</CardTitle></CardHeader><CardContent><p className="text-sm font-medium">{survey.is_anonymous ? "Evet" : "Hayır"}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground font-medium">Soru Sayısı</CardTitle></CardHeader><CardContent><p className="text-sm font-medium">{survey.questions.length}</p></CardContent></Card>
      </div>

      {canManage && survey.status !== "closed" && (
        <SurveyQuestionEditor surveyId={id} questions={survey.questions} />
      )}

      {(!canManage || survey.status === "closed") && survey.questions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Anket Önizleme</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {survey.questions.map((q, i) => (
                <div key={q.id} className="rounded-lg border border-border p-3">
                  <p className="text-sm font-medium">{i + 1}. {q.question_text}{q.is_required ? <span className="text-red-500">*</span> : ""}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {q.question_type === "scale" ? "1-5 Ölçek" : q.question_type === "choice" ? "Çoktan Seçmeli" : q.question_type === "yes_no" ? "Evet/Hayır" : "Kısa Metin"}
                  </p>
                  {q.options && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {(JSON.parse(typeof q.options === "string" ? q.options : JSON.stringify(q.options)) as string[]).map((opt) => (
                        <span key={opt} className="rounded-md bg-muted px-2 py-0.5 text-xs">{opt}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
