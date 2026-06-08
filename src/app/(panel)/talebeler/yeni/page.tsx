import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { PageHeader } from "@/components/layout/page-header";
import { StudentCreateForm } from "@/components/students/student-create-form";
import { StudentEmptyState } from "@/components/students/student-empty-state";
import { StudentErrorMessage } from "@/components/students/student-error-message";
import { requireRole } from "@/lib/auth";
import { getClassesForProfile, getDepartments } from "@/lib/students/queries";

type NewStudentPageProps = {
  searchParams: Promise<{ error?: string; errorMessage?: string }>;
};

export default async function NewStudentPage({ searchParams }: NewStudentPageProps) {
  const params = await searchParams;
  const { profile } = await requireRole(["admin", "genel_mudur", "bolum_muduru"]);
  const departments = await getDepartments();
  const classes = await getClassesForProfile(profile);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Talebeler"
        title="Yeni Talebe"
        description="Hızlı kayıt için zorunlu alanları doldurun. Detay bilgiler daha sonra düzenlenebilir."
      />
      <StudentErrorMessage error={params.error} errorMessage={params.errorMessage} />
      {departments.length > 0 && classes.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Hızlı Kayıt</CardTitle>
          </CardHeader>
          <CardContent>
            <StudentCreateForm departments={departments} classes={classes} profile={profile} />
          </CardContent>
        </Card>
      ) : (
        <StudentEmptyState
          title="Kayıt için bölüm ve sınıf gerekli"
          description="Talebe eklemeden önce aktif bölüm ve kurs sınıfı oluşturulmalıdır."
        />
      )}
    </div>
  );
}
