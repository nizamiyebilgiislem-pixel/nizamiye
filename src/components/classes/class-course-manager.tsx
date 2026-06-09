import { getEducationAssignmentData } from "@/lib/education/queries";
import { canManageClassCourses } from "@/lib/courses/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ProfileRow } from "@/types/database";
import { ClassCourseAssignForm } from "@/components/courses/class-course-assign-form";
import { ToggleClassCourseButton } from "@/components/courses/toggle-class-course-button";

type ClassCourseManagerProps = {
  classId: string;
  profile: ProfileRow;
};

export async function ClassCourseManager({ classId, profile }: ClassCourseManagerProps) {
  const data = await getEducationAssignmentData(profile, classId);

  if (!data) {
    return null;
  }

  const { classRow, classCourses, availableCourses } = data;
  const canManage = canManageClassCourses(profile, classRow);
  const activeCourses = classCourses.filter((cc) => cc.is_active);
  const passiveCourses = classCourses.filter((cc) => !cc.is_active);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between border-b border-border">
        <div>
          <CardTitle className="text-sm">Sınıf Dersleri</CardTitle>
          <p className="text-xs text-muted-foreground">
            {activeCourses.length} aktif, {passiveCourses.length} pasif ders
            {classCourses.length > 0 ? ` (toplam ${classCourses.length})` : ""}
          </p>
        </div>
        {canManage && availableCourses.length > 0 ? (
          <ClassCourseAssignForm classId={classId} availableCourses={availableCourses} />
        ) : null}
      </CardHeader>
      <CardContent className="space-y-2 p-4">
        {classCourses.length > 0 ? (
          [...activeCourses, ...passiveCourses].map((classCourse) => (
            <div
              key={classCourse.id}
              className={cn(
                "flex items-center justify-between gap-3 rounded-md border px-3 py-2.5",
                classCourse.is_active ? "border-border bg-white" : "border-dashed border-muted bg-muted/20",
              )}
            >
              <div className="min-w-0 flex-1">
                <p className={cn("truncate text-sm font-medium", classCourse.is_active ? "text-[#093657]" : "text-muted-foreground")}>
                  {classCourse.course?.name ?? "Ders silinmiş"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {classCourse.teacher ? classCourse.teacher.full_name : "Hoca atanmadı"}
                  {classCourse.slot_count > 0 ? ` · ${classCourse.slot_count} program slotu` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant={classCourse.is_active ? "default" : "outline"}>
                  {classCourse.is_active ? "Aktif" : "Pasif"}
                </Badge>
                {canManage ? (
                  <ToggleClassCourseButton classCourseId={classCourse.id} classId={classId} isActive={classCourse.is_active} />
                ) : null}
              </div>
            </div>
          ))
        ) : (
          <div className="space-y-3 py-4 text-center">
            <p className="text-sm text-muted-foreground">
              Bu sınıfa henüz ders atanmamış.
            </p>
            {canManage && availableCourses.length > 0 ? (
              <div>
                <ClassCourseAssignForm classId={classId} availableCourses={availableCourses} />
              </div>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
