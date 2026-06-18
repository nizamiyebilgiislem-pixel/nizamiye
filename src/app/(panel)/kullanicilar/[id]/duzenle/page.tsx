import { notFound, redirect } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { GeneratedPasswordFlash } from "@/components/profiles/generated-password-flash";
import { ProfileAuthManagement } from "@/components/profiles/profile-auth-management";
import { ProfileErrorMessage } from "@/components/profiles/profile-error-message";
import { ProfileForm } from "@/components/profiles/profile-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth";
import { readPasswordResetFlash } from "@/lib/profiles/password-reset-flash";
import {
  createProfileAuthAccountAction,
  resetProfileAuthPasswordAction,
  updateUserProfileAction,
} from "@/lib/profiles/actions";
import { canManageUserProfile, getCreatableRoles } from "@/lib/profiles/permissions";
import { getDepartmentsForProfiles, getProfileById } from "@/lib/profiles/queries";

type EditUserPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
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
  const canResetPassword = canManageUserProfile(profile, target) && profile.id !== target.id;
  const generatedPassword = await readPasswordResetFlash("kullanicilar", target.id);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Kullanıcılar" title="Profil Düzenle" description="Profil bilgilerini güncelleyin." />
      <ProfileErrorMessage error={query.error} />
      {query.success === "password-reset" ? (
        <div className="rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary">
          Şifre başarıyla sıfırlandı.
        </div>
      ) : null}
      {generatedPassword ? <GeneratedPasswordFlash password={generatedPassword} /> : null}
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
      {target.auth_user_id ? (
        <ProfileAuthManagement
          profile={target}
          source="kullanicilar"
          canManage={canManageUserProfile(profile, target)}
          canResetPassword={canResetPassword}
          returnPath={`/kullanicilar/${target.id}/duzenle`}
          createAuthAction={createProfileAuthAccountAction}
          resetPasswordAction={resetProfileAuthPasswordAction}
        />
      ) : null}
    </div>
  );
}
