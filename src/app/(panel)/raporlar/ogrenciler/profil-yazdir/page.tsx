import Link from "next/link";

import { PdfPrintButton } from "@/components/reports/pdf-print-button";
import { StudentProfileOverview } from "@/components/students/student-profile-overview";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireAuth } from "@/lib/auth";
import { getEvaluationsByStudent } from "@/lib/evaluations/queries";
import { getStudentGradeSummary } from "@/lib/grades/queries";
import { getInfirmaryRecordsByStudent } from "@/lib/infirmary/queries";
import { logPdfGenerated } from "@/lib/reports/actions";
import { getStudentBulkReportScope } from "@/lib/reports/student-bulk-pdf";
import { getStudentProfileEntries } from "@/lib/student-profile/queries";
import { cn } from "@/lib/utils";

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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Kapsam: {scope.scopeLabel}</Badge>
            <Badge variant="outline">Talebe: {profiles.length}</Badge>
            <Badge variant="outline">Sinif: {scope.classes.length}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Bu sayfa talebe detayindaki profil gorunumunu toplu yazdirir. Her talebe ayri sayfadan baslar.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/raporlar/ogrenciler" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Raporlara Don
          </Link>
          <PdfPrintButton label="Profil PDF Yazdir" />
        </div>
      </div>

      {profiles.length > 0 ? (
        <div data-print-root="true" className="mx-auto max-w-[210mm] space-y-8 print:max-w-none print:space-y-0">
          {profiles.map((item, index) => (
            <section key={item.student.id} className={cn("student-profile-bulk-page", index < profiles.length - 1 && "print:break-after-page")}>
              <StudentProfileOverview
                student={item.student}
                gradeSummary={item.gradeSummary}
                evaluations={item.evaluations}
                infirmaryRecords={item.infirmaryRecords}
                notes={item.notes}
                books={item.books}
                canEdit={false}
                showPdfButton={false}
              />
            </section>
          ))}
        </div>
      ) : (
        <EmptyState title="Bu kapsamda aktif talebe bulunamadi." />
      )}
    </div>
  );
}
