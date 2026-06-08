import { notFound, redirect } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { StudentEditForm } from "@/components/students/student-edit-form";
import { StudentErrorMessage } from "@/components/students/student-error-message";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth";
import { canEditStudent } from "@/lib/students/permissions";
import { getClassesForProfile, getStudentById } from "@/lib/students/queries";

type EditStudentPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function EditStudentPage({ params, searchParams }: EditStudentPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { profile } = await requireAuth();
  const student = await getStudentById(id);

  if (!student) {
    notFound();
  }

  if (!canEditStudent(profile, student, student.course_class)) {
    redirect(`/talebeler/${id}?error=unauthorized`);
  }

  const classes = await getClassesForProfile(profile);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Talebeler"
        title="Talebe Düzenle"
        description="Talebe kaydını güncelleyin. Silme işlemi yoktur; arşivleme durum alanıyla yapılır."
      />
      <StudentErrorMessage error={query.error} />
      <Card>
        <CardHeader>
          <CardTitle>{student.full_name}</CardTitle>
        </CardHeader>
        <CardContent>
          <StudentEditForm student={student} classes={classes} profile={profile} />
        </CardContent>
      </Card>
    </div>
  );
}
