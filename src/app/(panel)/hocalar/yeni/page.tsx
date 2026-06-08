import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { PageHeader } from "@/components/layout/page-header";
import { ProfileErrorMessage } from "@/components/profiles/profile-error-message";
import { ProfileForm } from "@/components/profiles/profile-form";
import { requireRole } from "@/lib/auth";
import { createStaffProfileAction } from "@/lib/profiles/actions";
import { getCreatableRoles } from "@/lib/profiles/permissions";
import { getDepartmentsForProfiles } from "@/lib/profiles/queries";

type NewTeacherPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function NewTeacherPage({ searchParams }: NewTeacherPageProps) {
  const params = await searchParams;
  const { profile } = await requireRole(["admin", "genel_mudur"]);
  const departments = await getDepartmentsForProfiles(profile);
  const roleOptions = getCreatableRoles(profile);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Hocalar"
        title="Yeni Profil"
        description="Hoca, bölüm müdürü veya genel müdür profili oluşturun; isterseniz aynı anda Auth hesabı da açın."
      />
      <ProfileErrorMessage error={params.error} />
      <Card>
        <CardHeader>
          <CardTitle>Profil Bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm
            action={createStaffProfileAction}
            departments={departments}
            roleOptions={roleOptions}
            mode="create"
            enableAuthFields
          />
        </CardContent>
      </Card>
    </div>
  );
}
