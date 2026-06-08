import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { ParentLinkedStudentsCard } from "@/components/parents/parent-linked-students-card";
import { ProfileAuthManagement } from "@/components/profiles/profile-auth-management";
import { ProfileAvatar } from "@/components/profiles/profile-avatar";
import { ProfileErrorMessage } from "@/components/profiles/profile-error-message";
import { ProfileInfoCard } from "@/components/profiles/profile-info-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import {
  createProfileAuthAccountAction,
  resetProfileAuthPasswordAction,
} from "@/lib/profiles/actions";
import { getParentProfileByIdForProfile } from "@/lib/parents/queries";
import { getProfileById } from "@/lib/profiles/queries";

type UserDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
};

export default async function UserDetailPage({ params, searchParams }: UserDetailPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { profile: viewer } = await requireRole(["admin", "genel_mudur"]);
  const profile = await getProfileById(id);

  if (!profile) {
    notFound();
  }

  const parentDetail = profile.role === "veli" ? await getParentProfileByIdForProfile(viewer, profile.id) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <ProfileAvatar name={profile.full_name} photoUrl={profile.photo_url} size="lg" />
        <PageHeader eyebrow="Kullanıcılar" title={profile.full_name} description={profile.email ?? "E-posta yok"} />
      </div>
      <ProfileErrorMessage error={query.error} />
      {query.success ? <SuccessMessage success={query.success} /> : null}
      <ProfileInfoCard profile={profile} />
      <ProfileAuthManagement
        profile={profile}
        source="kullanicilar"
        canManage
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
    "password-reset": "Şifre başarıyla güncellendi.",
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
          <p className="text-sm text-muted-foreground">Kayıt bulunamadı.</p>
        )}
      </CardContent>
    </Card>
  );
}
