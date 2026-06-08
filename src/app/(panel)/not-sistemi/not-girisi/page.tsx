import Link from "next/link";

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

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Not Sistemi" title="Not Girişi" description="Bölüm ve sınıf seçerek aktif talebelerin notlarını yönetin." />
      <GradeErrorMessage error={params.error} />
      <Card>
        <CardContent className="p-4">
          <form action="/not-sistemi/not-girisi" className="grid gap-3 md:grid-cols-[220px_220px_auto]">
            <select name="department" defaultValue={params.department ?? selectedClass?.department_id ?? ""} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
            </select>
            <select name="class" defaultValue={selectedClass?.id ?? ""} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              {classes.map((classRow) => <option key={classRow.id} value={classRow.id}>{classRow.name}</option>)}
            </select>
            <button type="submit" className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">Göster</button>
          </form>
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
