import { redirect } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { PageHeader } from "@/components/layout/page-header";
import { ProfileErrorMessage } from "@/components/profiles/profile-error-message";
import { ProfileForm } from "@/components/profiles/profile-form";
import { requireAuth } from "@/lib/auth";
import { createStaffProfileAction } from "@/lib/profiles/actions";
import { canCreateStaffProfile, getCreatableRoles } from "@/lib/profiles/permissions";
import { getDepartmentsForProfiles } from "@/lib/profiles/queries";

type NewTeacherPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function NewTeacherPage({ searchParams }: NewTeacherPageProps) {
  const params = await searchParams;
  const { profile } = await requireAuth();

  if (!canCreateStaffProfile(profile)) {
    redirect("/hocalar?error=unauthorized");
  }

  const departments = await getDepartmentsForProfiles(profile);
  const roleOptions = getCreatableRoles(profile);
  const isDepartmentManager = profile.role === "bolum_muduru";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Hocalar"
        title="Yeni Profil"
        description={isDepartmentManager ? "Kendi bölümünüz için hoca profili oluşturun." : "Hoca, bölüm müdürü veya genel müdür profili oluşturun; isterseniz aynı anda Auth hesabı da açın."}
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
            enableAuthFields={!isDepartmentManager}
            currentProfile={profile}
          />
        </CardContent>
      </Card>
    </div>
  );
}
