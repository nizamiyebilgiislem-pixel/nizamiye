import Link from "next/link";
import { FileDown } from "lucide-react";

import { GradeEntryFilter } from "@/components/grades/grade-entry-filter";
import { GradeErrorMessage } from "@/components/grades/grade-error-message";
import { PageHeader } from "@/components/layout/page-header";
import { StudentAvatar } from "@/components/students/student-avatar";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth";
import { canEditStudentGrades } from "@/lib/grades/permissions";
import { getClassCoursesForStudent, getStudentsForGradeEntry } from "@/lib/grades/queries";
import { cn } from "@/lib/utils";

type GradeEntryPageProps = { searchParams: Promise<{ department?: string; class?: string; error?: string }> };

export default async function GradeEntryPage({ searchParams }: GradeEntryPageProps) {
  const params = await searchParams;
  const { profile } = await requireAuth();
  const { departments, classes, selectedClass, students } = await getStudentsForGradeEntry(profile, {
    departmentId: params.department,
    classId: params.class,
  });
  const classCourses = selectedClass ? await getClassCoursesForStudent(selectedClass.id) : [];
  const selectedDepartmentId = params.department ?? selectedClass?.department_id ?? departments[0]?.id ?? "";

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Not Sistemi" title="Not Girişi" description="Bölüm ve sınıf seçerek aktif talebelerin notlarını yönetin." />
      <GradeErrorMessage error={params.error} />
      <Card>
        <CardContent className="flex flex-wrap items-end justify-between gap-3 p-4">
          <GradeEntryFilter
            departments={departments}
            classes={classes}
            selectedDepartmentId={selectedDepartmentId}
            selectedClassId={selectedClass?.id ?? ""}
          />
          {selectedClass ? (
            <Link
              href={`/not-sistemi/not-girisi/pdf?department=${selectedClass.department_id}&class=${selectedClass.id}`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              <FileDown className="mr-1.5 size-4" />
              PDF İndir
            </Link>
          ) : null}
        </CardContent>
      </Card>
      <div className="grid gap-3">
        {students.map((student) => {
          const editable = selectedClass ? canEditStudentGrades(profile, student, selectedClass, classCourses) : false;
          return (
            <div key={student.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3">
              <div className="flex items-center gap-3">
                <StudentAvatar name={student.full_name} photoUrl={student.photo_url} previewable />
                <div>
                  <p className="font-medium">{student.full_name}</p>
                  <p className="text-sm text-muted-foreground">{student.school_class ?? "Okul sınıfı yok"}</p>
                </div>
              </div>
              {editable ? (
                <Link href={`/not-sistemi/not-girisi/${student.id}`} className={cn(buttonVariants())}>Not Gir</Link>
              ) : (
                <span className="text-sm text-muted-foreground">Görüntüleme</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
