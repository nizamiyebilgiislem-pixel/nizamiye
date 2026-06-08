import { notFound, redirect } from "next/navigation";

import { CourseForm } from "@/components/courses/course-form";
import { GradeErrorMessage } from "@/components/grades/grade-error-message";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import { updateCourseAction } from "@/lib/courses/actions";
import { getCourseById, getCourseDepartments } from "@/lib/courses/queries";

type EditCoursePageProps = { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> };

export default async function EditCoursePage({ params, searchParams }: EditCoursePageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { profile } = await requireRole(["admin", "genel_mudur", "bolum_muduru"]);
  const course = await getCourseById(id);
  if (!course) notFound();
  if (profile.role === "bolum_muduru" && course.department_id !== profile.department_id) redirect("/not-sistemi/dersler?error=unauthorized");
  const departments = await getCourseDepartments(profile);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Not Sistemi" title="Ders Düzenle" description="Ders adı ve aktiflik durumunu güncelleyin." />
      <GradeErrorMessage error={query.error} />
      <Card>
        <CardHeader><CardTitle>{course.name}</CardTitle></CardHeader>
        <CardContent><CourseForm action={updateCourseAction} departments={departments} profile={profile} course={course} /></CardContent>
      </Card>
    </div>
  );
}
