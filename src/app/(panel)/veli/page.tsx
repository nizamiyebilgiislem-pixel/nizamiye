import { PageHeader } from "@/components/layout/page-header";
import { EvaluationSummary } from "@/components/evaluations/evaluation-summary";
import { GradeSummary } from "@/components/grades/grade-summary";
import { StudentInfirmarySummary } from "@/components/infirmary/infirmary-summary";
import { StudentDocumentSummary } from "@/components/documents/student-document-summary";
import { StudentDormitoryPanel } from "@/components/dormitory/student-dormitory-panel";
import { StudentProfileOverview } from "@/components/students/student-profile-overview";
import { Card, CardContent } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import { getDocumentsByStudent } from "@/lib/documents/queries";
import { getEvaluationsByStudent } from "@/lib/evaluations/queries";
import { getStudentGradeSummary } from "@/lib/grades/queries";
import { getStudentDormitoryAssignment } from "@/lib/dormitory/queries";
import { getInfirmaryRecordsByStudent } from "@/lib/infirmary/queries";
import { getLinkedStudentIdsForParent, getStudentProfileEntries } from "@/lib/student-profile/queries";
import { getStudentById } from "@/lib/students/queries";

export default async function ParentPanelPage() {
  const { profile } = await requireRole(["veli"]);
  const linkedStudentIds = await getLinkedStudentIdsForParent(profile.id);
  const students = (await Promise.all(linkedStudentIds.map((studentId) => getStudentById(studentId)))).filter((student) => student !== null);

  const profiles = await Promise.all(
    students.map(async (student) => {
      const [gradeSummary, evaluations, infirmaryRecords, profileEntries, documents] = await Promise.all([
        student.course_class ? getStudentGradeSummary(profile, student) : Promise.resolve(null),
        getEvaluationsByStudent(student.id),
        getInfirmaryRecordsByStudent(student.id),
        getStudentProfileEntries(student.id),
        getDocumentsByStudent(student.id),
      ]);
      const dormitoryAssignments = await getStudentDormitoryAssignment(student.id);

      return { student, gradeSummary, evaluations, infirmaryRecords, profileEntries, documents, dormitoryAssignments };
    }),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Veli"
        title="Öğrenci Profili"
        description="Bağlı talebelerinizin profil, not, kanaat, revir ve evrak bilgilerini sadece görüntüleyebilirsiniz."
      />

      {profiles.length > 0 ? (
        profiles.map(({ student, gradeSummary, evaluations, infirmaryRecords, profileEntries, documents, dormitoryAssignments }) => (
          <div key={student.id} className="space-y-4">
            <StudentProfileOverview
              student={student}
              gradeSummary={gradeSummary}
              evaluations={evaluations}
              infirmaryRecords={infirmaryRecords}
              notes={profileEntries.notes}
              books={profileEntries.books}
              canEdit={false}
            />
            <StudentDormitoryPanel
              currentAssignment={dormitoryAssignments.find((assignment) => assignment.status === "active") ?? null}
              history={dormitoryAssignments.filter((assignment) => assignment.status !== "active")}
              canManage={false}
              studentId={student.id}
            />
            {gradeSummary ? <GradeSummary summary={gradeSummary} studentId={student.id} canEdit={false} /> : null}
            <EvaluationSummary evaluations={evaluations} studentId={student.id} canEdit={false} />
            <StudentInfirmarySummary records={infirmaryRecords} studentId={student.id} canEdit={false} />
            <StudentDocumentSummary documents={documents} studentId={student.id} canEdit={false} />
          </div>
        ))
      ) : (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Bu veli hesabına bağlı talebe bulunamadı. Yönetici panelinden veli-talebe bağlantısı oluşturulmalıdır.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
