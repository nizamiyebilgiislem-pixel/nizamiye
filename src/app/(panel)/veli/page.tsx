import Link from "next/link";
import { redirect } from "next/navigation";
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
import { StudentCourseBooksPanel } from "@/components/course-books/student-course-books-panel";
import { StudentSelector } from "@/components/parents/student-selector";
import { StudentQuickCard } from "@/components/parents/student-quick-card";
import { StudentComparisonTable } from "@/components/parents/student-comparison-table";
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
import { getStudentLoans } from "@/lib/library/queries";
import { getStudentAttendanceSummaryForParent } from "@/lib/attendance/queries";
import { getHafizlikProgress } from "@/lib/hafizlik/actions";
import { getStudentCourseBookProgress } from "@/lib/course-books/queries";
import { cn } from "@/lib/utils";

type PageProps = {
  params: Promise<{}>;
  searchParams: Promise<{ student?: string; view?: string }>;
};

const scopeLabels: Record<string, string> = { all_students: "Tüm Öğrenciler", department: "Bölüm", class: "Sınıf" };

export default async function ParentPanelPage({ params, searchParams }: PageProps) {
  const { profile } = await requireRole(["veli"]);
  const query = await searchParams;

  const linkedStudentIds = await getLinkedStudentIdsForParent(profile.id);
  const students = (await Promise.all(linkedStudentIds.map((studentId) => getStudentById(studentId)))).filter((student) => student !== null);

  const surveys = await getSurveysForParent(profile.id);

  const studentDataPromises = students.map(async (student) => {
    const [gradeSummary, evaluations, infirmaryRecords, profileEntries, documents, dormitoryAssignment, dormitoryHistory, libraryLoans, attendanceSummary, hafizlikProgress, courseBookProgress] = await Promise.all([
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
      getStudentCourseBookProgress(student.id),
    ]);

    const hafizlikPercentage = hafizlikProgress.data
      ? Math.round(((hafizlikProgress.data.current_juz - 1) * 604 + hafizlikProgress.data.current_page) / 604 * 100)
      : null;

    const attendanceRate = attendanceSummary.student
      ? Math.round((attendanceSummary.daily.presentCount / (attendanceSummary.daily.presentCount + attendanceSummary.daily.excusedCount + attendanceSummary.daily.absentCount)) * 100)
      : null;

    return {
      student,
      gradeSummary,
      evaluations,
      infirmaryRecords,
      profileEntries,
      documents,
      dormitoryAssignment,
      dormitoryHistory,
      libraryLoans,
      attendanceSummary,
      hafizlikProgress: hafizlikProgress.data,
      hafizlikPercentage,
      attendanceRate,
      gradeAverage: gradeSummary?.generalAverage ?? null,
      courseBookProgress,
    };
  });

  const profiles = await Promise.all(studentDataPromises);

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

  const allActivities = Object.values(activitiesByDept).flat();
  const seenActivityIds = new Set<string>();
  const uniqueActivities = allActivities.filter((a) => {
    if (seenActivityIds.has(a.id)) return false;
    seenActivityIds.add(a.id);
    return true;
  });

  const selectableStudents = profiles.map((p) => ({
    id: p.student.id,
    full_name: p.student.full_name,
    photo_url: p.student.photo_url,
    course_class: p.student.course_class,
    department: p.student.department,
    gradeAverage: p.gradeAverage,
    hafizlikPercentage: p.hafizlikPercentage,
    attendanceRate: p.attendanceRate,
  }));

  const selectedStudentId = query.student;
  const showComparison = query.view === "compare";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Veli"
        title="Öğrenci Profili"
        description="Bağlı talebelerinizin profil, not, kanaat, yatakhane, revir, evrak, kütüphane, devamsızlık ve rehberlik bilgilerini görüntüleyebilirsiniz."
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
        <>
          {profiles.length > 1 && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Öğrencilerim</h2>
                <div className="flex gap-2">
                  <Link
                    href={showComparison ? "/veli" : "/veli?view=compare"}
                    className={buttonVariants({ variant: showComparison ? "default" : "outline", size: "sm" })}
                  >
                    {showComparison ? "Detay Görünüm" : "Karşılaştır"}
                  </Link>
                </div>
              </div>

              <StudentSelector
                students={selectableStudents}
                selectedId={selectedStudentId ?? null}
                baseHref="/veli"
              />

              {showComparison && (
                <StudentComparisonTable
                  students={selectableStudents}
                />
              )}
            </>
          )}

          {showComparison ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {profiles.map(({ student, gradeAverage, hafizlikPercentage, attendanceRate }) => (
                <StudentQuickCard
                  key={student.id}
                  student={student}
                  gradeAverage={gradeAverage}
                  hafizlikPercentage={hafizlikPercentage}
                  attendanceRate={attendanceRate}
                  pdfBaseHref={`/talebeler/${student.id}`}
                />
              ))}
            </div>
          ) : (
            profiles.map(({ student, gradeSummary, evaluations, infirmaryRecords, profileEntries, documents, dormitoryAssignment, dormitoryHistory, libraryLoans, attendanceSummary, hafizlikProgress, hafizlikPercentage, attendanceRate, gradeAverage, courseBookProgress }) => {
              const interviews = studentInterviews[student.id] ?? [];
              const isSelected = selectedStudentId === student.id || !selectedStudentId;
              const showFullDetail = !selectedStudentId || isSelected;

              if (profiles.length > 1 && selectedStudentId && !isSelected) return null;

              return (
                <div key={student.id} className="space-y-4">
                  {profiles.length === 1 && (
                    <StudentQuickCard
                      student={student}
                      gradeAverage={gradeAverage}
                      hafizlikPercentage={hafizlikPercentage}
                      attendanceRate={attendanceRate}
                      pdfBaseHref={`/talebeler/${student.id}`}
                    />
                  )}

                  {showFullDetail && (
                    <>
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

                      {courseBookProgress.length > 0 && (
                        <Card>
                          <CardHeader className="flex flex-row items-center gap-2 pb-3">
                            <BookOpen className="size-5 text-[#093657]" />
                            <div>
                              <CardTitle className="text-sm">Ders Kitapları</CardTitle>
                              <CardDescription className="text-xs">Öğrencinizin ders kitapları ilerlemesi</CardDescription>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <StudentCourseBooksPanel progress={courseBookProgress} />
                          </CardContent>
                        </Card>
                      )}

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
                    </>
                  )}
                </div>
              );
            })
          )}
        </>
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