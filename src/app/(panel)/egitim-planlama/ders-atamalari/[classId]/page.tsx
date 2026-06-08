import { notFound } from "next/navigation";

import { EducationErrorMessage } from "@/components/education/education-error-message";
import { PageHeader } from "@/components/layout/page-header";
import { RichProfileCard } from "@/components/profiles/rich-profile-card";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClassCourseAction, updateClassCourseAction } from "@/lib/education/actions";
import { canManageClassAssignments } from "@/lib/education/permissions";
import { getEducationAssignmentData } from "@/lib/education/queries";
import { requireAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

type Props = {
  params: Promise<{ classId: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
};

export default async function EducationAssignmentPage({ params, searchParams }: Props) {
  const [{ classId }, query] = await Promise.all([params, searchParams]);
  const { profile } = await requireAuth();
  const data = await getEducationAssignmentData(profile, classId);

  if (!data) {
    notFound();
  }

  const canManage = canManageClassAssignments(profile, data.classRow);
  const visibleClassCourses = canManage
    ? data.classCourses
    : data.classCourses.filter((classCourse) => classCourse.teacher_id === profile.id || data.classRow.class_teacher_id === profile.id);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Akademik"
        title={`${data.classRow.name} Ders Atamaları`}
        description={`${data.classRow.department?.name ?? "-"} · Sınıf hocası: ${data.classRow.class_teacher?.full_name ?? "Atanmadı"}`}
      />

      <EducationErrorMessage error={query.error} saved={query.saved} />
      <EducationErrorMessage error={data.loadError ?? undefined} />

      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle>Sınıf Bilgisi</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 p-4 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="grid gap-3 sm:grid-cols-2">
            <Info label="Sınıf" value={data.classRow.name} />
            <Info label="Bölüm" value={data.classRow.department?.name ?? "-"} />
          </div>
          <RichProfileCard
            profile={data.classRow.class_teacher}
            title="Sınıf Hocası"
            href={data.classRow.class_teacher ? `/hocalar/${data.classRow.class_teacher.id}` : undefined}
            emptyText="Sınıf hocası atanmadı"
          />
        </CardContent>
      </Card>

      {canManage ? (
        <Card>
          <CardHeader className="border-b border-border">
            <CardTitle>Yeni Ders Atama</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {data.availableCourses.length > 0 ? (
              <form action={createClassCourseAction} className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_170px_auto]">
                <input type="hidden" name="class_id" value={data.classRow.id} />
                <select name="course_id" required className="h-10 rounded-md border border-border bg-background px-3 text-sm shadow-sm">
                  <option value="">Ders seçin</option>
                  {data.availableCourses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </select>
                <select name="teacher_id" className="h-10 rounded-md border border-border bg-background px-3 text-sm shadow-sm">
                  <option value="">Hoca atanmamış</option>
                  {data.availableTeachers
                    .filter((teacher) => teacher.role === "hoca")
                    .map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.full_name}
                      </option>
                    ))}
                </select>
                <select name="is_active" defaultValue="true" className="h-10 rounded-md border border-border bg-background px-3 text-sm shadow-sm">
                  <option value="true">Aktif</option>
                  <option value="false">Pasif</option>
                </select>
                <button type="submit" className={cn(buttonVariants())}>
                  Kaydet
                </button>
              </form>
            ) : (
              <p className="text-sm text-muted-foreground">Bu sınıf için atanabilir aktif ders kalmadı.</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-4 text-sm text-muted-foreground">
            Bu sayfa yalnızca yönetim rolünde ders ataması yapmak için kullanılabilir.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle>Sınıfa Atanmış Dersler</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {visibleClassCourses.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr>
                    <th className="h-11 px-3 text-left font-medium text-[#093657]">Ders</th>
                    <th className="h-11 px-3 text-left font-medium text-[#093657]">Hoca</th>
                    <th className="h-11 px-3 text-left font-medium text-[#093657]">Durum</th>
                    <th className="h-11 px-3 text-right font-medium text-[#093657]">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleClassCourses.map((classCourse) => (
                    <tr key={classCourse.id} className="border-b border-border">
                      <td className="p-3 font-medium">{classCourse.course?.name ?? "-"}</td>
                      <td className="p-3">
                        {classCourse.teacher ? (
                          <RichProfileCard
                            profile={classCourse.teacher}
                            href={`/hocalar/${classCourse.teacher.id}`}
                            compact
                            className="border-0 bg-transparent p-0 shadow-none hover:bg-transparent"
                          />
                        ) : (
                          <span className="text-muted-foreground">Hoca atanmadı</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={cn("rounded-md px-2 py-1 text-xs font-medium", classCourse.is_active ? "bg-[#eaf1f6] text-[#093657]" : "bg-[#f3f6f9] text-muted-foreground")}>
                          {classCourse.is_active ? "Aktif" : "Pasif"}
                        </span>
                      </td>
                      <td className="p-3">
                        {canManage ? (
                          <form action={updateClassCourseAction} className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_120px_auto]">
                            <input type="hidden" name="id" value={classCourse.id} />
                            <select name="teacher_id" defaultValue={classCourse.teacher_id ?? ""} className="h-9 rounded-md border border-border bg-background px-3 text-sm shadow-sm">
                              <option value="">Hoca atanmamış</option>
                              {data.availableTeachers
                                .filter((teacher) => teacher.role === "hoca")
                                .concat(classCourse.teacher && !data.availableTeachers.some((teacher) => teacher.id === classCourse.teacher_id) ? [classCourse.teacher] : [])
                                .map((teacher) => (
                                  <option key={teacher.id} value={teacher.id}>
                                    {teacher.full_name}
                                  </option>
                                ))}
                            </select>
                            <select name="is_active" defaultValue={String(classCourse.is_active)} className="h-9 rounded-md border border-border bg-background px-3 text-sm shadow-sm">
                              <option value="true">Aktif</option>
                              <option value="false">Pasif</option>
                            </select>
                            <button type="submit" className={cn(buttonVariants({ size: "sm" }))}>
                              Güncelle
                            </button>
                          </form>
                        ) : (
                          <span className="text-sm text-muted-foreground">Salt okunur</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <CardContent className="py-8 text-center text-sm text-muted-foreground">Görüntülenecek ders ataması bulunamadı.</CardContent>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-[#f8fafc] p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#093657]">{value}</p>
    </div>
  );
}
