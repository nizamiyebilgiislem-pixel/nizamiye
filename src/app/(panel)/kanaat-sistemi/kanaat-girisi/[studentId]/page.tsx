import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { EvaluationErrorMessage } from "@/components/evaluations/evaluation-error-message";
import { EvaluationForm } from "@/components/evaluations/evaluation-form";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth";
import { canEditStudentEvaluations } from "@/lib/evaluations/permissions";
import { getEvaluationForStudentAndTerm, getEvaluationTerms } from "@/lib/evaluations/queries";
import { getStudentById } from "@/lib/students/queries";
import { getHafizlikProgress } from "@/lib/hafizlik/actions";
import { cn } from "@/lib/utils";

type StudentEvaluationPageProps = {
  params: Promise<{ studentId: string }>;
  searchParams: Promise<{ term?: string; error?: string; saved?: string }>;
};

export default async function StudentEvaluationPage({ params, searchParams }: StudentEvaluationPageProps) {
  const [{ studentId }, query] = await Promise.all([params, searchParams]);
  const { profile } = await requireAuth();
  const student = await getStudentById(studentId);
  if (!student) notFound();
  if (!student.course_class) redirect("/kanaat-sistemi/kanaat-girisi?error=class");
  if (!canEditStudentEvaluations(profile, student, student.course_class)) redirect(`/talebeler/${student.id}?error=unauthorized`);

  const terms = await getEvaluationTerms();
  const currentTermId = terms.find((term) => term.is_current && term.status === "active")?.id ?? null;
  const selectedTermId = terms.some((term) => term.id === query.term) ? query.term : currentTermId;
  const selectedTerm = terms.find((term) => term.id === selectedTermId) ?? null;
  const evaluation = selectedTermId ? await getEvaluationForStudentAndTerm(student.id, selectedTermId) : null;
  const hafizlikProgress = await getHafizlikProgress(student.id);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Kanaat Girişi" title={student.full_name} description={`${student.department?.name ?? "-"} · ${student.course_class.name}`} />
      <EvaluationErrorMessage error={query.error} />
      {query.saved ? <div className="rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary">Kanaat kaydedildi.</div> : null}
      {!currentTermId ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Aktif dönem tanımlanmamış. Kanaat girişi için önce aktif dönem seçiniz.
        </div>
      ) : null}
      {selectedTermId ? (
        <Card>
          <CardHeader>
            <CardTitle>Kanaat Formu</CardTitle>
          </CardHeader>
          <CardContent>
            <EvaluationForm
                studentId={student.id}
                terms={terms}
                selectedTermId={selectedTermId}
                evaluation={evaluation}
                readOnly={!selectedTerm || selectedTerm.status !== "active" || !selectedTerm.is_current}
                hafizlikProgress={hafizlikProgress.data}
              />
          </CardContent>
        </Card>
      ) : (
        <div className="flex items-center justify-between gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span>Kanaat girişi için önce akademik dönem oluşturulmalıdır.</span>
          <Link href="/not-sistemi/donemler" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "bg-white")}>
            Dönem Ekle
          </Link>
        </div>
      )}
    </div>
  );
}
