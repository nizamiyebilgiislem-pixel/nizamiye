import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, ClipboardCheck, HeartHandshake } from "lucide-react";

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
import { StudentSelector } from "@/components/parents/student-selector";
import { TodayLessonLogsCard } from "@/components/dashboard/today-lesson-logs-card";
import { StudentQuickCard } from "@/components/parents/student-quick-card";
import { StudentComparisonTable } from "@/components/parents/student-comparison-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
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
import { getStudentInterviewsForParent } from "@/lib/guidance/queries";
import { getStudentLoans } from "@/lib/library/queries";
import { getStudentAttendanceSummaryForParent } from "@/lib/attendance/queries";
import { getHafizlikProgress } from "@/lib/hafizlik/actions";
import { cn } from "@/lib/utils";

type PageProps = {
  params: Promise<{}>;
  searchParams: Promise<{ student?: string; view?: string }>;
};

export default async function SponsorPanelPage({ params, searchParams }: PageProps) {
  const { profile } = await requireRole(["sponsor"]);
  const query = await searchParams;

  const linkedStudentIds = await getLinkedStudentIdsForSponsor(profile.id);
  const students = (await Promise.all(linkedStudentIds.map((studentId) => getStudentById(studentId)))).filter((student) => student !== null);

  const studentDataPromises = students.map(async (student) => {
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
    };
  });

  const profiles = await Promise.all(studentDataPromises);

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
        eyebrow="Sponsor"
        title="Sponsorlu Öğrenciler"
        description="Sponsorluk yaptığınız öğrencilerin profil, not, kanaat, hafızlık, yatakhane, revir, evrak, kütüphane ve devamsızlık bilgilerini görüntüleyebilirsiniz."
      />

      <TodayLessonLogsCard maxItems={5} />

      {profiles.length > 0 ? (
        <>
          {profiles.length > 1 && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Sponsorlu Öğrenciler</h2>
                <div className="flex gap-2">
                  <Link
                    href={showComparison ? "/sponsor" : "/sponsor?view=compare"}
                    className={buttonVariants({ variant: showComparison ? "default" : "outline", size: "sm" })}
                  >
                    {showComparison ? "Detay Görünüm" : "Karşılaştır"}
                  </Link>
                </div>
              </div>

              <StudentSelector
                students={selectableStudents}
                selectedId={selectedStudentId ?? null}
                baseHref="/sponsor"
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
            profiles.map(({ student, gradeSummary, evaluations, infirmaryRecords, profileEntries, documents, dormitoryAssignment, dormitoryHistory, libraryLoans, attendanceSummary, hafizlikProgress, hafizlikPercentage, attendanceRate, gradeAverage }) => {
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
        <EmptyState title="Bu sponsor hesabına bağlı öğrenci bulunamadı." description="Yönetici panelinden sponsor-öğrenci bağlantısı oluşturulmalıdır." />
      )}
    </div>
  );
}