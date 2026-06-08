import Link from "next/link";
import { Pencil } from "lucide-react";

import { createExamTypeAction, updateExamTypeAction } from "@/lib/courses/actions";
import { canManageGradeSettings } from "@/lib/grades/permissions";
import type { CourseWithRelations } from "@/lib/courses/queries";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ProfileRow } from "@/types/database";

export function CourseList({ courses, profile }: { courses: CourseWithRelations[]; profile: ProfileRow }) {
  const manageable = canManageGradeSettings(profile);

  return (
    <div className="space-y-4">
      {courses.map((course) => (
        <Card key={course.id}>
          <CardHeader className="gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>{course.name}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {course.department?.name ?? "-"} · {course.exam_types.length} sınav türü · {course.is_active ? "Aktif" : "Pasif"}
              </p>
            </div>
            {manageable ? (
              <Link href={`/not-sistemi/dersler/${course.id}/duzenle`} className={cn(buttonVariants({ variant: "secondary" }))}>
                <Pencil className="size-4" aria-hidden="true" />Dersi Düzenle
              </Link>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-3">
            {course.exam_types.map((examType) => (
              <form key={examType.id} action={updateExamTypeAction} className="grid gap-2 rounded-md border border-border bg-background p-3 md:grid-cols-[1fr_120px_130px_auto]">
                <input type="hidden" name="id" value={examType.id} />
                <input type="hidden" name="course_id" value={course.id} />
                <input name="name" defaultValue={examType.name} disabled={!manageable} className="h-9 rounded-md border border-input bg-card px-3 text-sm disabled:opacity-60" />
                <input name="weight" type="number" step="0.01" min="0.01" defaultValue={Number(examType.weight)} disabled={!manageable} className="h-9 rounded-md border border-input bg-card px-3 text-sm disabled:opacity-60" />
                <select name="is_active" defaultValue={String(examType.is_active)} disabled={!manageable} className="h-9 rounded-md border border-input bg-card px-3 text-sm disabled:opacity-60">
                  <option value="true">Aktif</option>
                  <option value="false">Pasif</option>
                </select>
                {manageable ? <button type="submit" className="h-9 rounded-md bg-secondary px-3 text-sm">Güncelle</button> : null}
              </form>
            ))}
            {manageable ? (
              <form action={createExamTypeAction} className="grid gap-2 rounded-md border border-dashed border-border p-3 md:grid-cols-[1fr_120px_130px_auto]">
                <input type="hidden" name="course_id" value={course.id} />
                <input name="name" placeholder="Yeni sınav türü" className="h-9 rounded-md border border-input bg-background px-3 text-sm" />
                <input name="weight" type="number" step="0.01" min="0.01" defaultValue="1" className="h-9 rounded-md border border-input bg-background px-3 text-sm" />
                <select name="is_active" defaultValue="true" className="h-9 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="true">Aktif</option>
                  <option value="false">Pasif</option>
                </select>
                <button type="submit" className="h-9 rounded-md bg-primary px-3 text-sm text-primary-foreground">Ekle</button>
              </form>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
