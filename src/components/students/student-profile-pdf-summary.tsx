import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { StudentAvatar } from "@/components/students/student-avatar";
import type { EvaluationWithRelations } from "@/lib/evaluations/queries";
import type { StudentGradeSummary } from "@/lib/grades/queries";
import type { StudentWithRelations } from "@/lib/students/queries";
import { cn } from "@/lib/utils";

type StudentProfilePdfSummaryProps = {
  student: StudentWithRelations;
  gradeSummary: StudentGradeSummary | null;
  evaluations: EvaluationWithRelations[];
  compact?: boolean;
};

export function StudentProfilePdfSummary({
  student,
  gradeSummary,
  evaluations,
  compact = false,
}: StudentProfilePdfSummaryProps) {
  const latestEvaluation = evaluations[0] ?? null;
  const courseSummaries = gradeSummary?.courseSummaries ?? [];
  const className = compact ? "space-y-3" : "space-y-4";

  return (
    <section className={className}>
      <Card className="bg-white">
        <CardContent className={cn("grid gap-4 p-4", compact ? "lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]" : "lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]")}>
          <div className="flex items-start gap-4">
            <StudentAvatar name={student.full_name} photoUrl={student.photo_url} size={compact ? "default" : "lg"} />
            <div className="min-w-0 space-y-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  {student.department?.name ?? "Bolum yok"}
                </p>
                <h2 className="truncate text-2xl font-semibold text-[#093657]">{student.full_name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {student.course_class?.name ?? "Sinif yok"} · {student.registration_date ?? "-"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Durum: {student.status}</Badge>
                <Badge variant="outline">Numara: {student.identity_number ?? student.id.slice(0, 8).toUpperCase()}</Badge>
                <Badge variant="outline">Genel Ortalama: {formatAverage(gradeSummary?.generalAverage ?? null)}</Badge>
              </div>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <SummaryMetric label="Ders" value={String(courseSummaries.length)} />
            <SummaryMetric label="Kanaat" value={String(evaluations.length)} />
            <SummaryMetric label="Son Dönem" value={latestEvaluation?.term?.name ?? "-"} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card className="bg-white">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-[#093657]">Not Özeti</h3>
                <p className="text-xs text-muted-foreground">Sınav notları ve ders ortalaması.</p>
              </div>
              <Badge variant="outline">İlk 4 ders</Badge>
            </div>
            {courseSummaries.length > 0 ? (
              <div className="space-y-2">
                {courseSummaries.slice(0, 4).map((course) => (
                  <div key={course.courseId} className="space-y-2 rounded-md border border-border bg-[#f8fafc] px-3 py-2 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="min-w-0 truncate font-medium">{course.courseName}</span>
                      <Badge variant="outline">Ortalama {formatAverage(course.average)}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {course.examGrades.slice(0, 6).map((exam) => (
                        <span
                          key={exam.examTypeId}
                          className="inline-flex items-center gap-1 rounded-full border border-border bg-white px-2 py-1 text-[11px] text-muted-foreground"
                        >
                          <span className="max-w-24 truncate">{exam.examTypeName}</span>
                          <strong className="text-[#093657]">{exam.grade ?? "-"}</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Not verisi bulunamadı.</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="space-y-3 p-4">
            <div>
              <h3 className="text-base font-semibold text-[#093657]">Kanaat Özeti</h3>
              <p className="text-xs text-muted-foreground">Son değerlendirme ve kısa kanaat özeti.</p>
            </div>
            {latestEvaluation ? (
              <div className="space-y-2 rounded-md border border-border bg-[#f8fafc] p-3">
                <div className="grid grid-cols-3 gap-2">
                  <SummaryScore label="Davranış" value={latestEvaluation.behavior_score} />
                  <SummaryScore label="Devam" value={latestEvaluation.attendance_score} />
                  <SummaryScore label="Ders" value={latestEvaluation.lesson_performance_score} />
                </div>
                <p className="text-sm leading-5 text-muted-foreground">
                  {latestEvaluation.general_opinion ?? "Genel kanaat girilmedi."}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Kanaat kaydı bulunamadı.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-[#f8fafc] p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-[#093657]">{value}</p>
    </div>
  );
}

function SummaryScore({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-md border border-border bg-white px-2 py-1.5 text-center">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#093657]">{value ?? "-"}</p>
    </div>
  );
}

function formatAverage(value: number | null) {
  return value === null ? "-" : value.toFixed(2);
}
