import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { ProfileDeleteButton } from "@/components/profiles/profile-delete-button";
import { GeneratedPasswordFlash } from "@/components/profiles/generated-password-flash";
import { ParentLinkedStudentsCard } from "@/components/parents/parent-linked-students-card";
import { ProfileAuthManagement } from "@/components/profiles/profile-auth-management";
import { ProfileAvatar } from "@/components/profiles/profile-avatar";
import { ProfileErrorMessage } from "@/components/profiles/profile-error-message";
import { ProfileInfoCard } from "@/components/profiles/profile-info-card";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth";
import { readPasswordResetFlash } from "@/lib/profiles/password-reset-flash";
import {
  createProfileAuthAccountAction,
  resetProfileAuthPasswordAction,
} from "@/lib/profiles/actions";
import { canManageUserProfile } from "@/lib/profiles/permissions";
import { getParentProfileByIdForProfile } from "@/lib/parents/queries";
import { getProfileById } from "@/lib/profiles/queries";
import { cn } from "@/lib/utils";

type UserDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
};

export default async function UserDetailPage({ params, searchParams }: UserDetailPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { profile: viewer } = await requireRole(["admin", "genel_mudur", "yonetim"]);
  const profile = await getProfileById(id);

  if (!profile) {
    notFound();
  }

  const parentDetail = profile.role === "veli" ? await getParentProfileByIdForProfile(viewer, profile.id) : null;
  const canManage = canManageUserProfile(viewer, profile);
  const canResetPassword = canManage && viewer.id !== profile.id;
  const generatedPassword = await readPasswordResetFlash("kullanicilar", profile.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-start gap-4">
          <ProfileAvatar name={profile.full_name} photoUrl={profile.photo_url} size="lg" />
          <PageHeader eyebrow="Kullanıcılar" title={profile.full_name} description={profile.email ?? "E-posta yok"} />
        </div>
        {canManage ? (
          <div className="flex items-center gap-2">
            <Link
              href={`/kullanicilar/${profile.id}/duzenle`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              <Pencil className="mr-1.5 size-4" /> Düzenle
            </Link>
            <ProfileDeleteButton profileId={profile.id} profileName={profile.full_name} />
          </div>
        ) : null}
      </div>
      <ProfileErrorMessage error={query.error} />
      {query.success ? <SuccessMessage success={query.success} /> : null}
      {generatedPassword ? <GeneratedPasswordFlash password={generatedPassword} /> : null}
      <ProfileInfoCard profile={profile} />
      <ProfileAuthManagement
        profile={profile}
        source="kullanicilar"
        canManage
        canResetPassword={canResetPassword}
        returnPath={`/kullanicilar/${profile.id}`}
        createAuthAction={createProfileAuthAccountAction}
        resetPasswordAction={resetProfileAuthPasswordAction}
      />
      {profile.role === "hoca" ? <ClassList title="Sınıf Hocası Olduğu Sınıflar" classes={profile.assigned_classes} /> : null}
      {parentDetail ? <ParentLinkedStudentsCard parent={parentDetail} showManageButton /> : null}
    </div>
  );
}

function SuccessMessage({ success }: { success: string }) {
  const messages: Record<string, string> = {
    "auth-created": "Auth hesabı oluşturuldu.",
    "auth-linked": "Auth hesabı profile bağlandı.",
    "password-reset": "Şifre başarıyla sıfırlandı.",
  };

  return <div className="rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary">{messages[success] ?? success}</div>;
}

function ClassList({ title, classes }: { title: string; classes: Array<{ id: string; name: string }> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {classes.length > 0 ? (
          classes.map((classRow) => (
            <div key={classRow.id} className="rounded-md border border-border bg-background px-3 py-2 text-sm">
              {classRow.name}
            </div>
          ))
        ) : (
          <EmptyState title="Kayıt bulunamadı." />
        )}
      </CardContent>
    </Card>
  );
}
