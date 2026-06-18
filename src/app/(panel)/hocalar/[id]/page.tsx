import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Pencil } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { ProfileAuthManagement } from "@/components/profiles/profile-auth-management";
import { ProfileAvatar } from "@/components/profiles/profile-avatar";
import { ProfileErrorMessage } from "@/components/profiles/profile-error-message";
import { ProfileInfoCard } from "@/components/profiles/profile-info-card";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth";
import {
  createProfileAuthAccountAction,
  resetProfileAuthPasswordAction,
} from "@/lib/profiles/actions";
import { canEditStaffProfile, canViewStaffProfile } from "@/lib/profiles/permissions";
import { getProfileById } from "@/lib/profiles/queries";
import { cn } from "@/lib/utils";

type TeacherDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
};

export default async function TeacherDetailPage({ params, searchParams }: TeacherDetailPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { profile } = await requireAuth();
  const target = await getProfileById(id);

  if (!target) {
    notFound();
  }

  if (!canViewStaffProfile(profile, target)) {
    redirect("/hocalar?error=unauthorized");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-start gap-4">
          <ProfileAvatar name={target.full_name} photoUrl={target.photo_url} size="lg" />
          <PageHeader eyebrow="Hocalar" title={target.full_name} description={target.department?.name ?? "Bölüm yok"} />
        </div>
        {canEditStaffProfile(profile, target) ? (
          <Link href={`/hocalar/${target.id}/duzenle`} className={cn(buttonVariants())}>
            <Pencil className="size-4" aria-hidden="true" />
            Düzenle
          </Link>
        ) : null}
      </div>
      <ProfileErrorMessage error={query.error} />
      {query.success ? <SuccessMessage success={query.success} /> : null}
      <ProfileInfoCard profile={target} />
      <ProfileAuthManagement
        profile={target}
        source="hocalar"
        canManage={profile.role === "admin" || profile.role === "genel_mudur"}
        canResetPassword={(profile.role === "admin" || profile.role === "genel_mudur") && profile.id !== target.id}
        returnPath={`/hocalar/${target.id}`}
        createAuthAction={createProfileAuthAccountAction}
        resetPasswordAction={resetProfileAuthPasswordAction}
      />
      <ClassListCard title="Sınıf Hocası Olduğu Sınıflar" classes={target.assigned_classes} />
      <ClassListCard title="Kendi Bölümündeki Sınıflar" classes={target.department_classes} />
      <div className="grid gap-4 md:grid-cols-2">
        <Placeholder title="Verdiği Dersler" />
        <Placeholder title="Sorumlu Olduğu Öğrenciler" />
      </div>
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

function ClassListCard({ title, classes }: { title: string; classes: Array<{ id: string; name: string; is_active: boolean }> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {classes.length > 0 ? (
          classes.map((classRow) => (
            <Link
              key={classRow.id}
              href={`/siniflar/${classRow.id}`}
              className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <span className="font-medium">{classRow.name}</span>
              <span className="text-muted-foreground">{classRow.is_active ? "Aktif" : "Pasif"}</span>
            </Link>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">Kayıt bulunamadı.</p>
        )}
      </CardContent>
    </Card>
  );
}

function Placeholder({ title }: { title: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="py-8 text-center text-sm text-muted-foreground">Bu bölüm sonraki fazda aktif edilecek.</CardContent>
    </Card>
  );
}
