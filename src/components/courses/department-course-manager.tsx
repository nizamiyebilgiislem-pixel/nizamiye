import { getActiveCoursesByDepartment } from "@/lib/courses/queries";
import { canManageDepartmentCourses } from "@/lib/courses/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ProfileRow } from "@/types/database";
import { DepartmentCourseInlineForm } from "./department-course-inline-form";
import { ToggleCourseButton } from "./toggle-course-button";

type DepartmentCourseManagerProps = {
  departmentId: string;
  profile: ProfileRow;
};

export async function DepartmentCourseManager({ departmentId, profile }: DepartmentCourseManagerProps) {
  const courses = await getActiveCoursesByDepartment(departmentId);
  const canManage = canManageDepartmentCourses(profile, departmentId);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between border-b border-border">
        <CardTitle className="text-sm">Dersler ({courses.length})</CardTitle>
        {canManage ? <DepartmentCourseInlineForm departmentId={departmentId} /> : null}
      </CardHeader>
      <CardContent className="space-y-2 p-4">
        {courses.length > 0 ? (
          courses.map((course) => (
            <div
              key={course.id}
              className={cn(
                "flex items-center justify-between gap-3 rounded-md border px-3 py-2.5",
                course.is_active ? "border-border bg-white" : "border-dashed border-muted bg-muted/20",
              )}
            >
              <div className="min-w-0 flex-1">
                <p className={cn("truncate text-sm font-medium", course.is_active ? "text-[#093657]" : "text-muted-foreground")}>
                  {course.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {course.exam_types.length > 0
                    ? `${course.exam_types.length} sınav türü`
                    : "Sınav türü tanımlanmamış"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant={course.is_active ? "default" : "outline"}>
                  {course.is_active ? "Aktif" : "Pasif"}
                </Badge>
                {canManage ? (
                  <ToggleCourseButton courseId={course.id} departmentId={departmentId} isActive={course.is_active} />
                ) : null}
              </div>
            </div>
          ))
        ) : (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Bu bölümde henüz ders bulunmuyor.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
