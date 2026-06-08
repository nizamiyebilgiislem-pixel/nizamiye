import { CourseForm } from "@/components/courses/course-form";
import { GradeErrorMessage } from "@/components/grades/grade-error-message";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import { createCourseAction } from "@/lib/courses/actions";
import { getCourseDepartments } from "@/lib/courses/queries";

type NewCoursePageProps = { searchParams: Promise<{ error?: string }> };

export default async function NewCoursePage({ searchParams }: NewCoursePageProps) {
  const params = await searchParams;
  const { profile } = await requireRole(["admin", "genel_mudur", "bolum_muduru"]);
  const departments = await getCourseDepartments(profile);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Not Sistemi" title="Yeni Ders" description="Ders adı ve bölüm bilgisiyle yeni ders oluşturun." />
      <GradeErrorMessage error={params.error} />
      <Card>
        <CardHeader><CardTitle>Ders Bilgileri</CardTitle></CardHeader>
        <CardContent><CourseForm action={createCourseAction} departments={departments} profile={profile} /></CardContent>
      </Card>
    </div>
  );
}
