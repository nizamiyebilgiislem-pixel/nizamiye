import Link from "next/link";
import { FileText, HeartHandshake, CalendarDays } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { EvaluationSummary } from "@/components/evaluations/evaluation-summary";
import { GradeSummary } from "@/components/grades/grade-summary";
import { StudentInfirmarySummary } from "@/components/infirmary/infirmary-summary";
import { StudentDocumentSummary } from "@/components/documents/student-document-summary";
import { StudentDormitoryPanel } from "@/components/dormitory/student-dormitory-panel";
import { StudentProfileOverview } from "@/components/students/student-profile-overview";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import { getDocumentsByStudent } from "@/lib/documents/queries";
import { getEvaluationsByStudent } from "@/lib/evaluations/queries";
import { getStudentGradeSummary } from "@/lib/grades/queries";
import { getInfirmaryRecordsByStudent } from "@/lib/infirmary/queries";
import { getStudentActiveAssignment, getStudentAssignmentHistory } from "@/lib/dormitory/queries";
import { getLinkedStudentIdsForParent, getStudentProfileEntries } from "@/lib/student-profile/queries";
import { getStudentById } from "@/lib/students/queries";
import { getClassById } from "@/lib/classes/queries";
import { getDepartmentById } from "@/lib/departments/queries";
import { getSurveysForParent, getStudentInterviewsForParent, getDepartmentActivities } from "@/lib/guidance/queries";
import { cn } from "@/lib/utils";

const scopeLabels: Record<string, string> = { all_students: "Tüm Öğrenciler", department: "Bölüm", class: "Sınıf" };

export default async function ParentPanelPage() {
  const { profile } = await requireRole(["veli"]);
  const linkedStudentIds = await getLinkedStudentIdsForParent(profile.id);
  const students = (await Promise.all(linkedStudentIds.map((studentId) => getStudentById(studentId)))).filter((student) => student !== null);

  const surveys = await getSurveysForParent(profile.id);

  const studentDepartments = new Set<string>();
  for (const student of students) {
    if (student.course_class_id) {
      const cls = await getClassById(student.course_class_id);
      if (cls) {
        const dept = await getDepartmentById(cls.department_id);
        if (dept) studentDepartments.add(dept.id);
      }
    }
  }

  const activitiesByDept: Record<string, Awaited<ReturnType<typeof getDepartmentActivities>>> = {};
  for (const deptId of studentDepartments) {
    activitiesByDept[deptId] = await getDepartmentActivities(deptId);
  }

  const studentInterviews: Record<string, Awaited<ReturnType<typeof getStudentInterviewsForParent>>> = {};
  for (const student of students) {
    studentInterviews[student.id] = await getStudentInterviewsForParent(student.id);
  }

  const profiles = await Promise.all(
    students.map(async (student) => {
      const [gradeSummary, evaluations, infirmaryRecords, profileEntries, documents, dormitoryAssignment, dormitoryHistory] = await Promise.all([
        student.course_class ? getStudentGradeSummary(profile, student) : Promise.resolve(null),
        getEvaluationsByStudent(student.id),
        getInfirmaryRecordsByStudent(student.id),
        getStudentProfileEntries(student.id),
        getDocumentsByStudent(student.id),
        getStudentActiveAssignment(student.id),
        getStudentAssignmentHistory(student.id),
      ]);

      return { student, gradeSummary, evaluations, infirmaryRecords, profileEntries, documents, dormitoryAssignment, dormitoryHistory };
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
        eyebrow="Veli"
        title="Öğrenci Profili"
        description="Bağlı talebelerinizin profil, not, kanaat, yatakhane, revir, evrak ve rehberlik bilgilerini görüntüleyebilirsiniz."
      />

      {surveys.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-3">
            <FileText className="size-5 text-[#093657]" />
            <div>
              <CardTitle className="text-sm">Aktif Anketler</CardTitle>
              <CardDescription className="text-xs">Katılabileceğiniz anketler</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {surveys.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{s.title}</p>
                    <p className="text-xs text-muted-foreground">{scopeLabels[s.target_scope] ?? s.target_scope} — {s.question_count} soru</p>
                  </div>
                  <Link href={`/veli/anketler/${s.id}`} className={cn(buttonVariants({ size: "sm" }))}>Katıl</Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {uniqueActivities.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-3">
            <CalendarDays className="size-5 text-[#093657]" />
            <div>
              <CardTitle className="text-sm">Bölüm Etkinlikleri</CardTitle>
              <CardDescription className="text-xs">Öğrencinizin bölümüyle ilgili etkinlikler</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {uniqueActivities.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.activity_date}{a.location ? ` — ${a.location}` : ""}</p>
                  </div>
                  <Badge variant={a.status === "planned" ? "default" : a.status === "completed" ? "secondary" : "destructive"}>
                    {a.status === "planned" ? "Planlandı" : a.status === "completed" ? "Tamamlandı" : "İptal"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {profiles.length > 0 ? (
        profiles.map(({ student, gradeSummary, evaluations, infirmaryRecords, profileEntries, documents, dormitoryAssignment, dormitoryHistory }) => {
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
            </div>
          );
        })
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
