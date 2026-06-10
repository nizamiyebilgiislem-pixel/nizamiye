import { notFound, redirect } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { ProfileErrorMessage } from "@/components/profiles/profile-error-message";
import { ProfileForm } from "@/components/profiles/profile-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth";
import { updateUserProfileAction } from "@/lib/profiles/actions";
import { canManageUserProfile, getCreatableRoles } from "@/lib/profiles/permissions";
import { getDepartmentsForProfiles, getProfileById } from "@/lib/profiles/queries";

type EditUserPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function EditUserPage({ params, searchParams }: EditUserPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { profile } = await requireAuth();
  const target = await getProfileById(id);

  if (!target) {
    notFound();
  }

  if (!canManageUserProfile(profile, target)) {
    redirect(`/kullanicilar/${id}?error=unauthorized`);
  }

  const [departments] = await Promise.all([
    getDepartmentsForProfiles(profile),
  ]);
  const roleOptions = getCreatableRoles(profile);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Kullanıcılar" title="Profil Düzenle" description="Profil bilgilerini güncelleyin." />
      <ProfileErrorMessage error={query.error} />
      <Card>
        <CardHeader>
          <CardTitle>{target.full_name}</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm
            action={updateUserProfileAction}
            departments={departments}
            roleOptions={roleOptions}
            mode="edit"
            initialValues={target}
          />
        </CardContent>
      </Card>
    </div>
  );
}
