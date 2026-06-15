import { notFound, redirect } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { ProfileErrorMessage } from "@/components/profiles/profile-error-message";
import { ProfileForm } from "@/components/profiles/profile-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth";
import { updateStaffProfileAction } from "@/lib/profiles/actions";
import { canEditStaffProfile, getCreatableRoles } from "@/lib/profiles/permissions";
import { getAssignedClassCount, getDepartmentsForProfiles, getProfileById } from "@/lib/profiles/queries";

type EditTeacherPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function EditTeacherPage({ params, searchParams }: EditTeacherPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { profile } = await requireAuth();
  const target = await getProfileById(id);

  if (!target) {
    notFound();
  }

  if (!canEditStaffProfile(profile, target)) {
    redirect(`/hocalar/${id}?error=unauthorized`);
  }

  const [departments, assignedClassCount] = await Promise.all([
    getDepartmentsForProfiles(profile),
    getAssignedClassCount(target.id),
  ]);

  let roleOptions = getCreatableRoles(profile);
  const isDepartmentManager = profile.role === "bolum_muduru";

  if (isDepartmentManager) {
    roleOptions = ["hoca"];
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Hocalar" title="Profil Düzenle" description="Profil bilgilerini güncelleyin." />
      <ProfileErrorMessage error={query.error} />
      <Card>
        <CardHeader>
          <CardTitle>{target.full_name}</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm
            action={updateStaffProfileAction}
            departments={departments}
            roleOptions={roleOptions}
            mode="edit"
            initialValues={target}
            assignedClassCount={assignedClassCount}
            currentProfile={profile}
          />
        </CardContent>
      </Card>
    </div>
  );
}
