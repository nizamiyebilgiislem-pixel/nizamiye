import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth";
import { getAcademicTerms } from "@/lib/terms/queries";
import { logPdfGenerated } from "@/lib/reports/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import type { ClassCourseRow, CourseRow, GradeRow, ProfileRow } from "@/types/database";
import type { StudentRow } from "@/types/database";

type Props = {
  searchParams: Promise<{ department?: string; class?: string; term?: string }>;
};

export default async function ClassGradesPdfPage({ searchParams }: Props) {
  const params = await searchParams;
  const { profile } = await requireAuth();

  if (!params.class) redirect("/not-sistemi/not-girisi");

  const supabase = await createSupabaseServerClient();

  const [classResult, departmentResult, studentsResult] = await Promise.all([
    supabase.from("classes").select("*").eq("id", params.class).single(),
    params.department ? supabase.from("departments").select("*").eq("id", params.department).single() : Promise.resolve({ data: null }),
    supabase.from("students").select("*").eq("course_class_id", params.class).eq("status", "active").order("full_name", { ascending: true }),
  ]);

  const classRow = classResult.data;
  if (!classRow) redirect("/not-sistemi/not-girisi");

  const department = departmentResult.data;
  const students = studentsResult.data ?? [];

  const terms = await getAcademicTerms();
  const selectedTermId = params.term && terms.some((t) => t.id === params.term) ? params.term : null;
  const fallbackTermId = terms.find((t) => t.is_current && t.status === "active")?.id ?? null;
  const termId = selectedTermId ?? fallbackTermId;
  const activeTerm = terms.find((t) => t.id === termId) ?? null;

  const classCourses = await getClassCoursesForPdf(classRow.id);
  if (classCourses.length === 0) redirect("/not-sistemi/not-girisi");

  const allGrades = await getGradesForClass(students.map((s) => s.id), termId ?? undefined);
  const gradeMap = new Map<string, GradeRow>();
  for (const grade of allGrades) {
    const key = `${grade.student_id}:${grade.course_id}:${grade.exam_type_id}`;
    gradeMap.set(key, grade);
  }

  await logPdfGenerated(profile, {
    reportType: "class_grade_statement",
    entityType: "class",
    entityId: classRow.id,
    title: `${classRow.name} Sınıfı Not Kartları PDF`,
    description: `${classRow.name} sınıfı için toplu not kartı oluşturuldu (${students.length} öğrenci).`,
  });

  const now = new Date();

  return (
    <div className="mx-auto max-w-[210mm] space-y-4 p-6 print:max-w-none print:p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href={`/not-sistemi/not-girisi?department=${params.department ?? ""}&class=${params.class}`}
          className="inline-flex h-10 items-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-muted"
        >
          ← Geri Dön
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex h-10 items-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-muted"
        >
          Yazdır / PDF İndir
        </button>
      </div>

      <article className="space-y-8">
        <header className="border-b border-border pb-4">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-[#093657]">Nizamiye Öğrenci Sistemi</p>
          <div className="mt-2 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-[#093657]">{classRow.name} Sınıfı Not Kartları</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {department?.name ?? "Bölüm"} · {students.length} öğrenci
                {activeTerm ? ` · Dönem: ${activeTerm.name}` : ""}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              {new Intl.DateTimeFormat("tr-TR", { dateStyle: "long", timeStyle: "short" }).format(now)}
            </p>
          </div>
        </header>

        {students.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">Bu sınıfta aktif öğrenci bulunmuyor.</p>
        ) : (
          <div className="space-y-8">
            {students.map((student) => {
              const courseSummaries = buildCourseSummaries(student, classCourses, gradeMap);
              const generalAverage = calculateGeneralAverage(courseSummaries.map((c) => c.average));
              return (
                <Card key={student.id} className="break-inside-avoid">
                  <CardContent className="p-4">
                    <div className="mb-3 flex items-center justify-between border-b border-border pb-2">
                      <div>
                        <h2 className="font-semibold text-[#093657]">{student.full_name}</h2>
                        <p className="text-xs text-muted-foreground">{student.school_class ?? ""}</p>
                      </div>
                      <Badge variant="outline">{generalAverage !== null ? `Ort: ${generalAverage.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}` : "Veri yok"}</Badge>
                    </div>
                    {courseSummaries.length === 0 ? (
                      <p className="py-4 text-center text-sm text-muted-foreground">Bu öğrenci için ders kaydı bulunamadı.</p>
                    ) : (
                      <table className="min-w-full divide-y divide-border text-xs">
                        <thead>
                          <tr className="[&>th]:px-3 [&>th]:py-2 [&>th]:text-left [&>th]:font-medium [&>th]:text-muted-foreground">
                            <th className="w-1/3">Ders</th>
                            <th>Notlar</th>
                            <th className="w-16 text-right">Ort.</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {courseSummaries.map((course) => (
                            <tr key={course.courseId} className="[&>td]:px-3 [&>td]:py-2 align-top">
                              <td className="font-medium text-[#093657]">{course.courseName}</td>
                              <td>
                                <div className="flex flex-wrap gap-1">
                                  {course.examGrades.map((exam) => (
                                    <span
                                      key={exam.examTypeId}
                                      className={cn(
                                        "inline-block rounded px-1.5 py-0.5 text-[11px]",
                                        exam.grade !== null
                                          ? "bg-[#f8fafc] font-medium text-[#093657]"
                                          : "text-muted-foreground",
                                      )}
                                    >
                                      {exam.examTypeName}: {exam.grade ?? "-"}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="text-right font-semibold text-[#093657]">
                                {course.average !== null
                                  ? course.average.toLocaleString("tr-TR", { maximumFractionDigits: 2 })
                                  : "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </article>
    </div>
  );
}

async function getClassCoursesForPdf(classId: string) {
  const supabase = await createSupabaseServerClient();
  const [classCoursesResult, coursesResult, teachersResult, examTypesResult] = await Promise.all([
    supabase.from("class_courses").select("*").eq("class_id", classId).eq("is_active", true).order("created_at", { ascending: true }),
    supabase.from("courses").select("*").eq("is_active", true).order("name", { ascending: true }),
    supabase.from("profiles").select("*").eq("role", "hoca").eq("is_active", true).order("full_name", { ascending: true }),
    supabase.from("exam_types").select("*").eq("is_active", true).order("name", { ascending: true }),
  ]);

  const courseMap = new Map((coursesResult.data ?? []).map((c) => [c.id, c]));
  const teacherMap = new Map((teachersResult.data ?? []).map((t) => [t.id, t]));

  return (classCoursesResult.data ?? []).map((cc) => ({
    ...cc,
    course: courseMap.get(cc.course_id) ?? null,
    exam_types: (examTypesResult.data ?? []).filter((et) => et.course_id === cc.course_id),
    teacher: cc.teacher_id ? teacherMap.get(cc.teacher_id) ?? null : null,
  }));
}

async function getGradesForClass(studentIds: string[], termId?: string) {
  if (studentIds.length === 0) return [];
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("grades").select("*").in("student_id", studentIds);
  if (termId) {
    query = query.eq("term_id", termId);
  } else {
    query = query.is("term_id", null);
  }
  const { data } = await query;
  return data ?? [];
}

type GradeSummaryItem = {
  examTypeId: string;
  examTypeName: string;
  weight: number;
  grade: number | null;
};

type CourseGradeSummary = {
  courseId: string;
  courseName: string;
  examGrades: GradeSummaryItem[];
  average: number | null;
};

function buildCourseSummaries(
  student: StudentRow,
  classCourses: Array<ClassCourseRow & { course: CourseRow | null; exam_types: Array<{ id: string; name: string; weight: number }>; teacher: ProfileRow | null }>,
  gradeMap: Map<string, GradeRow>,
): CourseGradeSummary[] {
  return classCourses.map((cc) => {
    const course = cc.course;
    if (!course) return null;

    const examGrades = cc.exam_types.map((et) => {
      const key = `${student.id}:${course.id}:${et.id}`;
      const grade = gradeMap.get(key);
      return {
        examTypeId: et.id,
        examTypeName: et.name,
        weight: Number(et.weight),
        grade: grade ? Number(grade.grade) : null,
      };
    });

    return {
      courseId: course.id,
      courseName: course.name,
      examGrades,
      average: calculateWeightedAverage(examGrades),
    };
  }).filter((s): s is CourseGradeSummary => s !== null);
}

function calculateWeightedAverage(items: Array<{ grade: number | null; weight: number }>) {
  const gradedItems = items.filter((item) => item.grade !== null);
  const totalWeight = gradedItems.reduce((total, item) => total + item.weight, 0);
  if (gradedItems.length === 0 || totalWeight === 0) return null;
  return Math.round(gradedItems.reduce((total, item) => total + Number(item.grade) * item.weight, 0) / totalWeight * 100) / 100;
}

function calculateGeneralAverage(averages: Array<number | null>) {
  const valid = averages.filter((a): a is number => a !== null);
  if (valid.length === 0) return null;
  return Math.round(valid.reduce((total, a) => total + a, 0) / valid.length * 100) / 100;
}
