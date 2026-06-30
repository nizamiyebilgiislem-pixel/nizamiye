import { notFound, redirect } from "next/navigation";

import { PrintableReportShell } from "@/components/reports/printable-report-shell";
import { StudentAvatar } from "@/components/students/student-avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/native-select";
import { requireAuth } from "@/lib/auth";
import { canViewStudent } from "@/lib/students/permissions";
import { getStudentById } from "@/lib/students/queries";
import { getStudentGradeSummary } from "@/lib/grades/queries";
import { getAcademicTerms } from "@/lib/terms/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logPdfGenerated } from "@/lib/reports/actions";

type SearchParams = Promise<{ term?: string }>;

export default async function StudentGradesPdfPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: SearchParams }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { profile } = await requireAuth();
  const student = await getStudentById(id);

  if (!student) {
    notFound();
  }

  if (profile.role === "veli") {
    const supabase = await createSupabaseServerClient();
    const { data: link } = await supabase.from("parent_student_links").select("id").eq("parent_profile_id", profile.id).eq("student_id", student.id).maybeSingle();
    if (!link) {
      redirect("/raporlar?error=unauthorized");
    }
  } else if (!canViewStudent(profile, student.course_class)) {
    redirect("/raporlar?error=unauthorized");
  }

  const terms = await getAcademicTerms();
  const selectedTermId = query.term && terms.some((term) => term.id === query.term) ? query.term : null;
  const summary = await getStudentGradeSummary(profile, student, selectedTermId);
  const activeTerm = terms.find((term) => term.id === summary.selectedTermId) ?? null;

  await logPdfGenerated(profile, {
    reportType: "student_grade_statement",
    entityType: "student",
    entityId: student.id,
    studentId: student.id,
    title: `${student.full_name} Not Dökümü PDF`,
    description: `${student.full_name} için not dökümü oluşturuldu.`,
  });

  return (
    <PrintableReportShell
      title="Not Dökümü"
      subtitle="Seçilen dönem için ders notları, ortalamalar ve başarı özeti."
      backHref={`/talebeler/${student.id}`}
      meta={
        <>
          <Badge variant="outline">Talebe: {student.full_name}</Badge>
          <Badge variant="outline">Dönem: {activeTerm?.name ?? "Aktif dönem"}</Badge>
          <Badge variant="outline">Genel başarı: {formatAverage(summary.generalAverage)}</Badge>
        </>
      }
    >
      <Card>
        <CardContent className="space-y-4 p-4">
          <form className="flex flex-wrap items-end gap-3 print:hidden">
            <input type="hidden" name="id" value={student.id} />
            <label className="space-y-1 text-sm">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Dönem</span>
              <NativeSelect name="term" defaultValue={summary.selectedTermId ?? ""} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="">Aktif / varsayılan</option>
                {terms.map((term) => (
                  <option key={term.id} value={term.id}>
                    {term.name}
                  </option>
                ))}
              </NativeSelect>
            </label>
            <button type="submit" className="inline-flex h-10 items-center rounded-md bg-[#093657] px-4 text-sm font-medium text-white hover:bg-[#072943]">
              Dönemi Göster
            </button>
          </form>

          <div className="flex items-start gap-4">
            <StudentAvatar name={student.full_name} photoUrl={student.photo_url} size="lg" previewable />
            <div>
              <h2 className="text-2xl font-semibold text-[#093657]">{student.full_name}</h2>
              <p className="text-sm text-muted-foreground">{student.department?.name ?? "Bölüm yok"} · {student.course_class?.name ?? "Sınıf yok"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-[#f8fafc]">
              <tr className="[&>th]:px-4 [&>th]:py-3 [&>th]:text-left [&>th]:font-medium [&>th]:text-muted-foreground">
                <th>Ders</th>
                <th>Notlar</th>
                <th>Ortalama</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              {summary.courseSummaries.length > 0 ? (
                summary.courseSummaries.map((course) => (
                  <tr key={course.courseId} className="[&>td]:px-4 [&>td]:py-3 align-top">
                    <td className="font-medium text-[#093657]">{course.courseName}</td>
                    <td>
                      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                        {course.examGrades.map((exam) => (
                          <div key={exam.examTypeId} className="rounded-md border border-border bg-[#f8fafc] p-2">
                            <p className="text-xs text-muted-foreground">{exam.examTypeName}</p>
                            <p className="mt-1 text-sm font-semibold text-[#093657]">{exam.grade ?? "-"}</p>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="font-semibold text-[#093657]">{formatAverage(course.average)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-10 text-center text-sm text-muted-foreground" colSpan={3}>
                    Bu dönem için not verisi bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </PrintableReportShell>
  );
}

function formatAverage(value: number | null) {
  return value === null ? "Veri yok" : value.toLocaleString("tr-TR", { maximumFractionDigits: 2 });
}
