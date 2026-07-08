import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { StudentAvatar } from "@/components/students/student-avatar";
import type { EvaluationWithRelations } from "@/lib/evaluations/queries";
import type { StudentGradeSummary } from "@/lib/grades/queries";
import type { StudentWithRelations } from "@/lib/students/queries";
import type { StudentProfileNoteWithRelations } from "@/lib/student-profile/queries";
import { cn } from "@/lib/utils";

type StudentProfilePdfSummaryProps = {
  student: StudentWithRelations;
  gradeSummary: StudentGradeSummary | null;
  evaluations: EvaluationWithRelations[];
  notes: StudentProfileNoteWithRelations[];
  compact?: boolean;
};

export function StudentProfilePdfSummary({
  student,
  gradeSummary,
  evaluations,
  notes,
  compact = false,
}: StudentProfilePdfSummaryProps) {
  const recentNotes = notes.slice(0, 1);
  const courseSummaries = gradeSummary?.courseSummaries ?? [];
  const className = compact ? "space-y-3" : "space-y-4";
  const latestTermName = evaluations[0]?.term?.name ?? "-";

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

          <div className="flex justify-end">
            <Badge variant="outline" className="max-w-full truncate text-[11px]">
              Dönem: {latestTermName}
            </Badge>
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
            {recentNotes.length > 0 ? (
              <div className="rounded-md border border-border bg-[#f8fafc] p-2.5">
                {recentNotes.map((note) => (
                  <div key={note.id} className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-[#093657]">{note.creator?.full_name ?? "Hoca"}</p>
                      <Badge variant="outline" className="shrink-0 text-[10px]">
                        {note.term?.name ?? "Dönem yok"}
                      </Badge>
                    </div>
                    <p className="text-sm leading-5 text-muted-foreground">{note.note}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function formatAverage(value: number | null) {
  return value === null ? "-" : value.toFixed(2);
}
