import { notFound, redirect } from "next/navigation";

import { PrintableReportShell } from "@/components/reports/printable-report-shell";
import { StudentAvatar } from "@/components/students/student-avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/native-select";
import { EmptyState } from "@/components/ui/empty-state";
import { requireAuth } from "@/lib/auth";
import { canViewStudent } from "@/lib/students/permissions";
import { getStudentById } from "@/lib/students/queries";
import { getAcademicTerms } from "@/lib/terms/queries";
import { getEvaluationsByStudent } from "@/lib/evaluations/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logPdfGenerated } from "@/lib/reports/actions";

type SearchParams = Promise<{ term?: string }>;

export default async function StudentEvaluationPdfPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: SearchParams }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { profile } = await requireAuth();
  const student = await getStudentById(id);

  if (!student) {
    notFound();
  }

  if (profile.role === "veli") {
    const supabase = await createSupabaseServerClient();
    const { data: link } = await supabase.from("parent_student_links").select("id").eq("parent_profile_id", profile.id).eq("student_id", student.id).maybeSingle();
    if (!link) {
      redirect("/raporlar?error=unauthorized");
    }
  } else if (!canViewStudent(profile, student.course_class)) {
    redirect("/raporlar?error=unauthorized");
  }

  const terms = await getAcademicTerms();
  const evaluations = await getEvaluationsByStudent(student.id);
  const selectedTermId = query.term && terms.some((term) => term.id === query.term) ? query.term : null;
  const visibleEvaluations = selectedTermId ? evaluations.filter((evaluation) => evaluation.term_id === selectedTermId) : evaluations;
  const activeTerm = terms.find((term) => term.id === selectedTermId) ?? null;

  await logPdfGenerated(profile, {
    reportType: "student_evaluation_statement",
    entityType: "student",
    entityId: student.id,
    studentId: student.id,
    title: `${student.full_name} Kanaat PDF`,
    description: `${student.full_name} için kanaat raporu oluşturuldu.`,
  });

  return (
    <PrintableReportShell
      title="Kanaat Raporu"
      subtitle="Seçilen dönem için öğretmen kanaatleri ve genel görüşler."
      backHref={`/talebeler/${student.id}`}
      meta={
        <>
          <Badge variant="outline">Talebe: {student.full_name}</Badge>
          <Badge variant="outline">Dönem: {activeTerm?.name ?? "Tüm dönemler"}</Badge>
        </>
      }
    >
      <Card>
        <CardContent className="space-y-4 p-4">
          <form className="flex flex-wrap items-end gap-3 print:hidden">
            <label className="space-y-1 text-sm">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Dönem</span>
              <NativeSelect name="term" defaultValue={selectedTermId ?? ""} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="">Tüm dönemler</option>
                {terms.map((term) => (
                  <option key={term.id} value={term.id}>
                    {term.name}
                  </option>
                ))}
              </NativeSelect>
            </label>
            <button type="submit" className="inline-flex h-10 items-center rounded-md bg-[#093657] px-4 text-sm font-medium text-white hover:bg-[#072943]">
              Dönemi Göster
            </button>
          </form>

          <div className="flex items-start gap-4">
            <StudentAvatar name={student.full_name} photoUrl={student.photo_url} size="lg" previewable />
            <div>
              <h2 className="text-2xl font-semibold text-[#093657]">{student.full_name}</h2>
              <p className="text-sm text-muted-foreground">{student.department?.name ?? "Bölüm yok"} · {student.course_class?.name ?? "Sınıf yok"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-4">
          {visibleEvaluations.length > 0 ? (
            visibleEvaluations.map((evaluation) => (
              <div key={evaluation.id} className="rounded-md border border-border bg-[#f8fafc] p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-[#093657]">{evaluation.term?.name ?? "Dönem yok"}</p>
                    <p className="text-xs text-muted-foreground">
                      {evaluation.created_by_profile?.full_name ?? "Sistem"} · {formatDate(evaluation.created_at)}
                    </p>
                  </div>
                  <Badge variant="outline">Kanaat</Badge>
                </div>
                <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  <Score label="Davranış" value={evaluation.behavior_score} />
                  <Score label="Devam" value={evaluation.attendance_score} />
                  <Score label="Ders" value={evaluation.lesson_performance_score} />
                  <Score label="Disiplin" value={evaluation.discipline_score} />
                  <Score label="Ezber" value={evaluation.memorization_score} />
                </div>
                {evaluation.general_opinion ? <p className="mt-3 text-sm leading-6 text-muted-foreground">{evaluation.general_opinion}</p> : null}
              </div>
            ))
          ) : (
            <EmptyState title="Bu dönem için kanaat kaydı bulunmadı." />
          )}
        </CardContent>
      </Card>
    </PrintableReportShell>
  );
}

function Score({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-md border border-border bg-white p-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#093657]">{value ?? "-"}</p>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(new Date(value));
}
