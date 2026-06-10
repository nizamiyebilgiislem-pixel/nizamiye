import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { DersSistemiForm } from "@/components/ders-sistemi/ders-sistemi-form";
import { PageHeader } from "@/components/layout/page-header";
import { ProfileErrorMessage } from "@/components/profiles/profile-error-message";
import { requireRole } from "@/lib/auth";
import { getDersSistemiCreateData } from "@/lib/ders-sistemi/queries";

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export default async function NewDersPage({ searchParams }: Props) {
  const params = await searchParams;
  const { profile } = await requireRole(["admin", "genel_mudur", "bolum_muduru"]);
  const { departments, classes, teachers } = await getDersSistemiCreateData(profile);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Ders Sistemi"
        title="Yeni Ders"
        description="Ders oluşturun ve istediğiniz sınıflara atayın."
      />
      <ProfileErrorMessage error={params.error} />
      <Card>
        <CardHeader>
          <CardTitle>Ders Bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <DersSistemiForm
            departments={departments}
            classes={classes}
            teachers={teachers}
            profileRole={profile.role}
            profileDepartmentId={profile.department_id}
          />
        </CardContent>
      </Card>
    </div>
  );
}
