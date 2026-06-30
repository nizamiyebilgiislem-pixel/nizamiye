import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { EmptyState } from "@/components/ui/empty-state";
import { ClassErrorMessage } from "@/components/classes/class-error-message";
import { ClassForm } from "@/components/classes/class-form";
import { PageHeader } from "@/components/layout/page-header";
import { createClassAction } from "@/lib/classes/actions";
import { getDepartmentsForProfile, getTeachersForProfile } from "@/lib/classes/queries";
import { requireRole } from "@/lib/auth";

type NewClassPageProps = {
  searchParams: Promise<{ error?: string; errorMessage?: string }>;
};

export default async function NewClassPage({ searchParams }: NewClassPageProps) {
  const params = await searchParams;
  const { profile } = await requireRole(["admin", "genel_mudur", "bolum_muduru"]);
  const departments = await getDepartmentsForProfile(profile);
  const teachers = await getTeachersForProfile(profile);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Sınıflar"
        title="Yeni Sınıf"
        description="Sınıf oluşturun ve aynı bölümdeki aktif hocalardan sınıf hocası atayın."
      />
      <ClassErrorMessage error={params.error} errorMessage={params.errorMessage} />
      {departments.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Sınıf Bilgileri</CardTitle>
          </CardHeader>
          <CardContent>
            <ClassForm action={createClassAction} departments={departments} teachers={teachers} profile={profile} mode="create" />
          </CardContent>
        </Card>
      ) : (
        <EmptyState title="Bölüm bulunamadı" description="Sınıf oluşturmak için aktif bölüm kaydı gereklidir." />
      )}
    </div>
  );
}
