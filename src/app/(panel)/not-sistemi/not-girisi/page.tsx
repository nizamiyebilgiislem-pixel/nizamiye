import Link from "next/link";
import { FileDown } from "lucide-react";

import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { GradeEntryFilter } from "@/components/grades/grade-entry-filter";
import { GradeErrorMessage } from "@/components/grades/grade-error-message";
import { PageHeader } from "@/components/layout/page-header";
import { StudentAvatar } from "@/components/students/student-avatar";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { requireAuth } from "@/lib/auth";
import { saveClassCourseGradesAction } from "@/lib/grades/actions";
import { getGradeEntryWorkspace } from "@/lib/grades/queries";
import { cn } from "@/lib/utils";

type GradeEntryPageProps = {
  searchParams: Promise<{ department?: string; class?: string; course?: string; exam?: string; error?: string; success?: string }>;
};

export default async function GradeEntryPage({ searchParams }: GradeEntryPageProps) {
  const params = await searchParams;
  const { profile } = await requireAuth();
  const workspace = await getGradeEntryWorkspace(profile, {
    departmentId: params.department,
    classId: params.class,
    classCourseId: params.course,
    examTypeId: params.exam,
  });
  const classesForDepartment = workspace.selectedDepartmentId
    ? workspace.classes.filter((classRow) => classRow.department_id === workspace.selectedDepartmentId)
    : [];
  const coursesForClass = workspace.selectedClassId
    ? workspace.classCourses.filter((classCourse) => classCourse.class_id === workspace.selectedClassId)
    : [];

  const termStateMessage = !workspace.currentTerm
    ? "Aktif dönem yok. Not girişi başlamadan önce cari dönemi belirleyin."
    : workspace.currentTerm.status !== "active" || !workspace.currentTerm.is_active
      ? "Kapalı dönem için sınav girişi yapılamaz."
      : null;
  const helperMessage = !workspace.selectedDepartmentId
    ? "Önce bölüm seçiniz."
    : classesForDepartment.length === 0
      ? "Bu bölüme ait aktif sınıf bulunamadı."
    : !workspace.selectedClassId
      ? "Önce sınıf seçiniz."
      : coursesForClass.length === 0
        ? "Bu sınıfa atanmış aktif ders bulunamadı."
      : !workspace.selectedClassCourseId
        ? "Ders seçildikten sonra öğrenciler listelenecek."
        : (workspace.selectedClassCourse?.examTypes.length ?? 0) === 0
          ? "Bu derse ait aktif sınav türü bulunamadı."
        : !workspace.selectedExamTypeId
          ? "Sınav türü seçildikten sonra öğrenciler listelenecek."
          : workspace.students.length === 0
            ? "Bu sınıfta aktif öğrenci bulunamadı."
            : null;
  const readOnlyMessage = workspace.isReadOnly
    ? "Bu rolde sınav girişi salt okunur durumdadır. Kaydet butonu gösterilmez."
    : profile.role === "hoca" && workspace.classes.length === 0
      ? "Yetkiniz olan ders/sınıf ataması bulunmadığı için sınav girişi yapamazsınız."
      : null;
  const gradeEntryFormKey = [
    workspace.selectedDepartmentId,
    workspace.selectedClassId,
    workspace.selectedClassCourseId,
    workspace.selectedExamTypeId,
  ].join(":");

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Not Sistemi" title="Sınav Girişi" description="Bölüm, sınıf, ders ve sınav türü seçerek sınav girişini düzenli bir akışla yönetin." />
      <GradeErrorMessage error={params.error} />

      {params.success === "saved" ? (
        <Card className="border-primary/30 bg-primary/10">
          <CardContent className="py-3 text-sm text-primary">Notlar başarıyla kaydedildi.</CardContent>
        </Card>
      ) : null}

      {termStateMessage ? (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="py-3 text-sm text-amber-900">{termStateMessage}</CardContent>
        </Card>
      ) : null}

      {readOnlyMessage ? (
        <Card>
          <CardContent className="py-3 text-sm text-muted-foreground">{readOnlyMessage}</CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-base">Sınav Girişi Filtreleri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4">
          <GradeEntryFilter
            departments={workspace.departments}
            classes={workspace.classes}
            classCourses={workspace.classCourses}
            selectedDepartmentId={workspace.selectedDepartmentId}
            selectedClassId={workspace.selectedClassId}
            selectedClassCourseId={workspace.selectedClassCourseId}
            selectedExamTypeId={workspace.selectedExamTypeId}
            lockDepartmentSelection={workspace.lockDepartmentSelection}
          />

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-[#f8fafc] px-4 py-3 text-sm">
            <div className="space-y-1">
              <p className="font-medium text-[#093657]">
                {workspace.currentTerm ? `Aktif dönem: ${workspace.currentTerm.name}` : "Aktif dönem seçilmedi"}
              </p>
              <p className="text-muted-foreground">
                {helperMessage ?? "Seçimler tamamlandıktan sonra mevcut notları ve yeni giriş alanlarını aşağıda görebilirsiniz."}
              </p>
            </div>

            {workspace.selectedClass ? (
              <Link
                href={`/not-sistemi/not-girisi/pdf?department=${workspace.selectedClass.department_id}&class=${workspace.selectedClass.id}`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                <FileDown className="mr-1.5 size-4" />
                PDF İndir
              </Link>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {workspace.departments.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">Bölüm yok.</CardContent>
        </Card>
      ) : helperMessage ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">{helperMessage}</CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <form key={gradeEntryFormKey} action={saveClassCourseGradesAction} className="space-y-4 p-4">
              <input type="hidden" name="department_id" value={workspace.selectedDepartmentId} />
              <input type="hidden" name="class_id" value={workspace.selectedClassId} />
              <input type="hidden" name="class_course_id" value={workspace.selectedClassCourseId} />
              <input type="hidden" name="exam_type_id" value={workspace.selectedExamTypeId} />
              <input type="hidden" name="term_id" value={workspace.currentTerm?.id ?? ""} />

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Öğrenci</TableHead>
                    <TableHead>Mevcut Not</TableHead>
                    <TableHead>Yeni Not</TableHead>
                    <TableHead>Açıklama / Not</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workspace.students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="whitespace-normal">
                        <div className="flex items-center gap-3">
                          <StudentAvatar name={student.full_name} photoUrl={student.photo_url} previewable />
                          <div>
                            <p className="font-medium">{student.full_name}</p>
                            <p className="text-xs text-muted-foreground">{student.school_class ?? "Okul sınıfı yok"}</p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="whitespace-normal">
                        <p className="font-medium">{student.existingGrade ?? "-"}</p>
                        {student.existingNote ? <p className="mt-1 text-xs text-muted-foreground">{student.existingNote}</p> : null}
                      </TableCell>

                      <TableCell>
                        <Input
                          name={`grade:${student.id}`}
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          defaultValue=""
                          disabled={!workspace.canSubmit}
                          placeholder={student.existingGrade === null ? "0 - 100" : "Yeni not girin"}
                          className="min-w-28"
                        />
                        <p className="mt-1 text-xs text-muted-foreground">Boş bırakılırsa bu öğrenci için yeni kayıt yapılmaz.</p>
                      </TableCell>

                      <TableCell className="whitespace-normal">
                        <Textarea
                          name={`note:${student.id}`}
                          defaultValue=""
                          disabled={!workspace.canSubmit}
                          placeholder={student.existingNote ? "Yeni açıklama ekleyin" : "Açıklama ekleyin"}
                          className="min-h-24 min-w-56"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {workspace.canSubmit ? (
                <div className="flex justify-end">
                  <FormSubmitButton pendingLabel="Kaydediliyor...">Notları Kaydet</FormSubmitButton>
                </div>
              ) : null}
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
