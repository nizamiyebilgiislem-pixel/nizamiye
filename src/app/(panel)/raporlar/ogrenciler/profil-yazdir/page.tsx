import { Badge } from "@/components/ui/badge";
import { PrintableReportShell } from "@/components/reports/printable-report-shell";
import { StudentProfileOverview } from "@/components/students/student-profile-overview";
import { EmptyState } from "@/components/ui/empty-state";
import { requireAuth } from "@/lib/auth";
import { getEvaluationsByStudent } from "@/lib/evaluations/queries";
import { getStudentGradeSummary } from "@/lib/grades/queries";
import { getInfirmaryRecordsByStudent } from "@/lib/infirmary/queries";
import { logPdfGenerated } from "@/lib/reports/actions";
import { getStudentBulkReportScope } from "@/lib/reports/student-bulk-pdf";
import { getStudentProfileEntries } from "@/lib/student-profile/queries";

type StudentProfilePrintPageProps = {
  searchParams: Promise<{ departmentId?: string; classId?: string }>;
};

export default async function StudentProfilePrintPage({ searchParams }: StudentProfilePrintPageProps) {
  const [{ profile }, query] = await Promise.all([requireAuth(), searchParams]);
  const scope = await getStudentBulkReportScope(profile, {
    departmentId: query.departmentId || null,
    classId: query.classId || null,
  });

  const profiles = await Promise.all(
    scope.students.map(async (student) => {
      const [gradeSummary, evaluations, infirmaryRecords, profileEntries] = await Promise.all([
        student.course_class ? getStudentGradeSummary(profile, student) : Promise.resolve(null),
        getEvaluationsByStudent(student.id),
        profile.role === "rehberlik" ? Promise.resolve([]) : getInfirmaryRecordsByStudent(student.id),
        getStudentProfileEntries(student.id),
      ]);

      return {
        student,
        gradeSummary,
        evaluations,
        infirmaryRecords,
        notes: profileEntries.notes,
        books: profileEntries.books,
      };
    }),
  );

  if (profiles.length > 0) {
    await logPdfGenerated(profile, {
      reportType: "student_bulk_profile_print",
      entityType: "student_report",
      entityId: query.classId ?? query.departmentId ?? profile.id,
      title: `${scope.scopeLabel} Talebe Profil Raporu`,
      description: `${profiles.length} talebe icin profil gorunumlu toplu rapor olusturuldu.`,
    });
  }

  return (
    <PrintableReportShell
      title="Talebe Profil Raporlari"
      subtitle="Veli paneli ve talebe detay profil görünümündeki not, kanaat, revir, yorum ve kitap özetleri."
      backHref="/raporlar/ogrenciler"
      backLabel="Raporlara Don"
      meta={
        <>
          <Badge variant="outline">Kapsam: {scope.scopeLabel}</Badge>
          <Badge variant="outline">Talebe: {profiles.length}</Badge>
          <Badge variant="outline">Sinif: {scope.classes.length}</Badge>
        </>
      }
    >
      {profiles.length > 0 ? (
        <div className="space-y-8">
          {profiles.map((item, index) => (
            <section key={item.student.id} className={index < profiles.length - 1 ? "print:break-after-page" : undefined}>
              <StudentProfileOverview
                student={item.student}
                gradeSummary={item.gradeSummary}
                evaluations={item.evaluations}
                infirmaryRecords={item.infirmaryRecords}
                notes={item.notes}
                books={item.books}
                canEdit={false}
              />
            </section>
          ))}
        </div>
      ) : (
        <EmptyState title="Bu kapsamda aktif talebe bulunamadi." />
      )}
    </PrintableReportShell>
  );
}
