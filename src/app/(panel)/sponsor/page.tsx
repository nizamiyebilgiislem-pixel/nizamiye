import Link from "next/link";
import { BookOpen, ClipboardCheck, FileText, HeartHandshake, CalendarDays } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { EvaluationSummary } from "@/components/evaluations/evaluation-summary";
import { GradeSummary } from "@/components/grades/grade-summary";
import { HafizlikPanel } from "@/components/hafizlik/hafizlik-panel";
import { StudentInfirmarySummary } from "@/components/infirmary/infirmary-summary";
import { StudentDocumentSummary } from "@/components/documents/student-document-summary";
import { StudentDormitoryPanel } from "@/components/dormitory/student-dormitory-panel";
import { StudentProfileOverview } from "@/components/students/student-profile-overview";
import { StudentLibraryPanel } from "@/components/library/student-library-panel";
import { StudentAttendanceSummaryPanel } from "@/components/attendance/student-attendance-summary";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import { getDocumentsByStudent } from "@/lib/documents/queries";
import { getEvaluationsByStudent } from "@/lib/evaluations/queries";
import { getStudentGradeSummary } from "@/lib/grades/queries";
import { getInfirmaryRecordsByStudent } from "@/lib/infirmary/queries";
import { getStudentActiveAssignment, getStudentAssignmentHistory } from "@/lib/dormitory/queries";
import { getLinkedStudentIdsForSponsor, getStudentProfileEntries } from "@/lib/student-profile/queries";
import { getStudentById } from "@/lib/students/queries";
import { getClassById } from "@/lib/classes/queries";
import { getDepartmentById } from "@/lib/departments/queries";
import { getSurveysForParent, getStudentInterviewsForParent, getDepartmentActivities } from "@/lib/guidance/queries";
import { getStudentLoans } from "@/lib/library/queries";
import { getStudentAttendanceSummaryForParent } from "@/lib/attendance/queries";
import { getHafizlikProgress } from "@/lib/hafizlik/actions";
import { cn } from "@/lib/utils";

const scopeLabels: Record<string, string> = { all_students: "Tüm Öğrenciler", department: "Bölüm", class: "Sınıf" };

export default async function SponsorPanelPage() {
  const { profile } = await requireRole(["sponsor"]);
  const linkedStudentIds = await getLinkedStudentIdsForSponsor(profile.id);
  const students = (await Promise.all(linkedStudentIds.map((studentId) => getStudentById(studentId)))).filter((student) => student !== null);

  const surveys = await getSurveysForParent(profile.id);

  const classResults = await Promise.all(
    students.map(async (student) => {
      if (!student.course_class_id) return null;
      const cls = await getClassById(student.course_class_id);
      if (!cls) return null;
      const dept = await getDepartmentById(cls.department_id);
      return dept?.id ?? null;
    }),
  );
  const studentDepartments = new Set(classResults.filter((id): id is string => id !== null));

  const activitiesByDept: Record<string, Awaited<ReturnType<typeof getDepartmentActivities>>> = {};
  const deptActivities = await Promise.all(
    [...studentDepartments].map(async (deptId) => {
      const activities = await getDepartmentActivities(deptId);
      return { deptId, activities };
    }),
  );
  for (const { deptId, activities } of deptActivities) {
    activitiesByDept[deptId] = activities;
  }

  const interviewResults = await Promise.all(
    students.map(async (student) => {
      const interviews = await getStudentInterviewsForParent(student.id);
      return { studentId: student.id, interviews };
    }),
  );
  const studentInterviews: Record<string, Awaited<ReturnType<typeof getStudentInterviewsForParent>>> = {};
  for (const { studentId, interviews } of interviewResults) {
    studentInterviews[studentId] = interviews;
  }

  const profiles = await Promise.all(
    students.map(async (student) => {
      const [gradeSummary, evaluations, infirmaryRecords, profileEntries, documents, dormitoryAssignment, dormitoryHistory, libraryLoans, attendanceSummary, hafizlikProgress] = await Promise.all([
        student.course_class ? getStudentGradeSummary(profile, student) : Promise.resolve(null),
        getEvaluationsByStudent(student.id),
        getInfirmaryRecordsByStudent(student.id),
        getStudentProfileEntries(student.id),
        getDocumentsByStudent(student.id),
        getStudentActiveAssignment(student.id),
        getStudentAssignmentHistory(student.id),
        getStudentLoans(student.id),
        getStudentAttendanceSummaryForParent(student.id),
        getHafizlikProgress(student.id),
      ]);

      return { student, gradeSummary, evaluations, infirmaryRecords, profileEntries, documents, dormitoryAssignment, dormitoryHistory, libraryLoans, attendanceSummary, hafizlikProgress: hafizlikProgress.data };
    }),
  );

  const allActivities = Object.values(activitiesByDept).flat();
  const seenActivityIds = new Set<string>();
  const uniqueActivities = allActivities.filter((a) => {
    if (seenActivityIds.has(a.id)) return false;
    seenActivityIds.add(a.id);
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Sponsor"
        title="Sponsorlu Öğrenciler"
        description="Sponsorluk yaptığınız öğrencilerin profil, not, kanaat, hafızlık, yatakhane, revir, evrak, kütüphane ve devamsızlık bilgilerini görüntüleyebilirsiniz."
      />

      {profiles.length > 0 ? (
        profiles.map(({ student, gradeSummary, evaluations, infirmaryRecords, profileEntries, documents, dormitoryAssignment, dormitoryHistory, libraryLoans, attendanceSummary, hafizlikProgress }) => {
          const interviews = studentInterviews[student.id] ?? [];
          return (
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
              {gradeSummary ? <GradeSummary summary={gradeSummary} studentId={student.id} canEdit={false} /> : null}
              <EvaluationSummary evaluations={evaluations} studentId={student.id} canEdit={false} />
              <HafizlikPanel studentName={student.full_name} progress={hafizlikProgress} />

              {interviews.length > 0 && (
                <Card>
                  <CardHeader className="flex flex-row items-center gap-2 pb-3">
                    <HeartHandshake className="size-5 text-[#093657]" />
                    <div>
                      <CardTitle className="text-sm">Rehberlik Görüşmeleri</CardTitle>
                      <CardDescription className="text-xs">{student.full_name} için rehberlik kayıtları</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {interviews.map((i) => (
                        <div key={i.id} className="rounded-md border border-border px-3 py-2">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">{i.title}</p>
                            <Badge variant={i.status === "open" ? "default" : i.status === "followed" ? "secondary" : "outline"}>
                              {i.status === "open" ? "Açık" : i.status === "followed" ? "Takip Ediliyor" : "Kapalı"}
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{i.interview_date}{i.counselor ? ` — ${i.counselor.full_name}` : ""}</p>
                          {i.summary && <p className="mt-1 text-sm">{i.summary}</p>}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <StudentDormitoryPanel activeAssignment={dormitoryAssignment} history={dormitoryHistory} />
              <StudentInfirmarySummary records={infirmaryRecords} studentId={student.id} canEdit={false} />
              <StudentDocumentSummary documents={documents} studentId={student.id} canEdit={false} />

              {libraryLoans.length > 0 && (
                <Card>
                  <CardHeader className="flex flex-row items-center gap-2 pb-3">
                    <BookOpen className="size-5 text-[#093657]" />
                    <div>
                      <CardTitle className="text-sm">Kütüphane Emanetleri</CardTitle>
                      <CardDescription className="text-xs">{student.full_name} için kütüphane kayıtları</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <StudentLibraryPanel loans={libraryLoans} />
                  </CardContent>
                </Card>
              )}

              {attendanceSummary.student && (
                <Card>
                  <CardHeader className="flex flex-row items-center gap-2 pb-3">
                    <ClipboardCheck className="size-5 text-[#093657]" />
                    <div>
                      <CardTitle className="text-sm">Devamsızlık / Yoklama</CardTitle>
                      <CardDescription className="text-xs">{student.full_name} için yoklama kayıtları</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <StudentAttendanceSummaryPanel summary={attendanceSummary} />
                  </CardContent>
                </Card>
              )}
            </div>
          );
        })
      ) : (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Bu sponsor hesabına bağlı öğrenci bulunamadı. Yönetici panelinden sponsor-öğrenci bağlantısı oluşturulmalıdır.
          </CardContent>
        </Card>
      )}
    </div>
  );
}