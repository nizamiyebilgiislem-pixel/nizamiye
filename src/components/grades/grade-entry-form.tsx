import Link from "next/link";

import { saveStudentGradesAction } from "@/lib/grades/actions";
import type { StudentGradeSummary } from "@/lib/grades/queries";
import type { StudentWithRelations } from "@/lib/students/queries";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function GradeEntryForm({ student, summary }: { student: StudentWithRelations; summary: StudentGradeSummary }) {
  const hasTerms = summary.terms.length > 0;
  const hasCourses = summary.courseSummaries.length > 0;
  const selectedTerm = summary.terms.find((term) => term.id === summary.selectedTermId) ?? null;
  const isEditable = Boolean(selectedTerm && selectedTerm.status === "active" && selectedTerm.is_current);
  const readOnlyMessage = !selectedTerm
    ? "Aktif dönem tanımlanmamış. Not girişi için önce aktif dönem seçiniz."
    : isEditable
      ? null
      : "Bu dönem kapalı veya arşivli olduğu için düzenleme yapılamaz.";

  return (
    <form action={saveStudentGradesAction} className="space-y-4">
      <input type="hidden" name="student_id" value={student.id} />
      {readOnlyMessage ? <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{readOnlyMessage}</div> : null}
      <label className="grid max-w-sm gap-2 text-sm font-medium">
        Dönem
        <select
          name="term_id"
          defaultValue={summary.selectedTermId ?? ""}
          disabled={!hasTerms || !isEditable}
          required={hasTerms}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal disabled:opacity-60"
        >
          {!hasTerms ? <option value="">Önce dönem oluşturun</option> : null}
          {summary.terms.map((term) => <option key={term.id} value={term.id}>{term.name}</option>)}
        </select>
      </label>
      {!hasTerms ? (
        <div className="flex items-center justify-between gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span>Not girişi için önce akademik dönem eklenmelidir.</span>
          <Link href="/not-sistemi/donemler" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "bg-white")}>
            Dönem Ekle
          </Link>
        </div>
      ) : null}
      {!hasCourses ? (
        <div className="rounded-md border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
          Bu talebenin sınıfına atanmış aktif ders bulunamadı.
        </div>
      ) : null}
      {summary.courseSummaries.map((course) => (
        <div key={course.courseId} className="rounded-lg border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold">{course.courseName}</h2>
              {!course.canEdit ? <Badge variant="outline">Salt okunur</Badge> : null}
            </div>
            <span className="text-sm text-muted-foreground">Ortalama: {course.average?.toFixed(2) ?? "-"}</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {course.examGrades.map((exam) => (
              <div key={exam.examTypeId} className="space-y-2 rounded-md border border-border bg-background p-3">
                <label className="grid gap-1 text-sm font-medium">
                  {exam.examTypeName}
                  <input
                    name={`grade:${course.courseId}:${exam.examTypeId}`}
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    defaultValue={exam.grade ?? ""}
                    disabled={!course.canEdit || !isEditable}
                    className="h-10 rounded-md border border-input bg-card px-3 text-sm font-normal disabled:opacity-60"
                  />
                </label>
                <input
                  name={`note:${course.courseId}:${exam.examTypeId}`}
                  placeholder="Not açıklaması"
                  defaultValue={exam.note ?? ""}
                  disabled={!course.canEdit || !isEditable}
                  className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm disabled:opacity-60"
                />
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!hasTerms || !hasCourses || !isEditable}
          className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
        >
          Notları Kaydet
        </button>
      </div>
    </form>
  );
}
