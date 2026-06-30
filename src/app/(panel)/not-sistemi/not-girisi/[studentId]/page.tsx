import { notFound, redirect } from "next/navigation";

import { GradeEntryForm } from "@/components/grades/grade-entry-form";
import { GradeErrorMessage } from "@/components/grades/grade-error-message";
import { PageHeader } from "@/components/layout/page-header";
import { StudentAvatar } from "@/components/students/student-avatar";
import { requireAuth } from "@/lib/auth";
import { canEditStudentGrades } from "@/lib/grades/permissions";
import { getStudentGradeSummary } from "@/lib/grades/queries";
import { getStudentById } from "@/lib/students/queries";

type StudentGradeEntryPageProps = {
  params: Promise<{ studentId: string }>;
  searchParams: Promise<{ term?: string; error?: string; saved?: string }>;
};

export default async function StudentGradeEntryPage({ params, searchParams }: StudentGradeEntryPageProps) {
  const [{ studentId }, query] = await Promise.all([params, searchParams]);
  const { profile } = await requireAuth();
  const student = await getStudentById(studentId);
  if (!student) notFound();
  if (!student.course_class) redirect("/not-sistemi/not-girisi?error=class");

  const summary = await getStudentGradeSummary(profile, student, query.term);
  const currentTerm = summary.terms.find((term) => term.is_current && term.status === "active") ?? null;
  const selectedTerm = summary.terms.find((term) => term.id === summary.selectedTermId) ?? null;
  if (!canEditStudentGrades(profile, student, student.course_class, summary.classCourses)) {
    redirect(`/talebeler/${student.id}?error=unauthorized`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <StudentAvatar name={student.full_name} photoUrl={student.photo_url} size="lg" previewable />
        <PageHeader eyebrow="Sınav Girişi" title={student.full_name} description={`${student.department?.name ?? "-"} · ${student.course_class.name}`} />
      </div>
      <GradeErrorMessage error={query.error} />
      {query.saved ? <div className="rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary">Notlar kaydedildi.</div> : null}
      {!currentTerm ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Aktif dönem tanımlanmamış. Not girişi için önce aktif dönem seçiniz.
        </div>
      ) : null}
      {selectedTerm && (!selectedTerm.is_current || selectedTerm.status !== "active") ? (
        <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {selectedTerm.name} dönemi kapalı veya arşivli olduğu için düzenleme yapılamaz.
        </div>
      ) : null}
      <GradeEntryForm student={student} summary={summary} />
    </div>
  );
}
