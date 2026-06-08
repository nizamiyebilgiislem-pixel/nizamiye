import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StudentGradeSummary } from "@/lib/grades/queries";
import { cn } from "@/lib/utils";

export function GradeSummary({
  summary,
  studentId,
  canEdit,
}: {
  summary: StudentGradeSummary;
  studentId: string;
  canEdit: boolean;
}) {
  return (
    <Card>
      <CardHeader className="gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>Notlar</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">Genel ortalama: {formatAverage(summary.generalAverage)}</p>
        </div>
        {canEdit ? (
          <Link href={`/not-sistemi/not-girisi/${studentId}`} className={cn(buttonVariants())}>Notları Düzenle</Link>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {summary.courseSummaries.length > 0 ? summary.courseSummaries.map((course) => (
          <div key={course.courseId} className="rounded-md border border-border bg-background p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold">{course.courseName}</h3>
              <span className="text-sm text-muted-foreground">Ortalama: {formatAverage(course.average)}</span>
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
              {course.examGrades.map((exam) => (
                <div key={exam.examTypeId} className="rounded-md border border-border bg-card p-3">
                  <p className="text-xs text-muted-foreground">{exam.examTypeName} · Ağırlık {exam.weight}</p>
                  <p className="mt-1 text-lg font-semibold">{exam.grade ?? "-"}</p>
                  {exam.note ? <p className="mt-1 text-xs text-muted-foreground">{exam.note}</p> : null}
                </div>
              ))}
            </div>
          </div>
        )) : <p className="text-sm text-muted-foreground">Bu öğrenci için aktif ders bulunamadı.</p>}
      </CardContent>
    </Card>
  );
}

function formatAverage(value: number | null) {
  return value === null ? "-" : value.toFixed(2);
}
