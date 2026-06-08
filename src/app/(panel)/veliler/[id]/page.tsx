import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Pencil } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { ParentErrorMessage } from "@/components/parents/parent-error-message";
import { ParentLinkedStudentsCard } from "@/components/parents/parent-linked-students-card";
import { ProfileAuthManagement } from "@/components/profiles/profile-auth-management";
import { ProfileAvatar } from "@/components/profiles/profile-avatar";
import { ProfileInfoCard } from "@/components/profiles/profile-info-card";
import { buttonVariants } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth";
import {
  canCreateParentProfile,
  canEditParentProfile,
  canViewParentDetail,
} from "@/lib/parents/permissions";
import { getParentProfileByIdForProfile } from "@/lib/parents/queries";
import {
  createProfileAuthAccountAction,
  resetProfileAuthPasswordAction,
} from "@/lib/profiles/actions";
import { cn } from "@/lib/utils";

type ParentDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
};

export default async function ParentDetailPage({ params, searchParams }: ParentDetailPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { profile } = await requireAuth();
  const parent = await getParentProfileByIdForProfile(profile, id);

  if (!parent) {
    notFound();
  }

  if (!canViewParentDetail(profile, parent.linked_students.length)) {
    redirect("/veliler?error=unauthorized");
  }

  const canManage = canCreateParentProfile(profile);
  const canEdit = canEditParentProfile(profile, parent.linked_students.length);
  const canManageAuth = profile.role === "admin" || profile.role === "genel_mudur";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-start gap-4">
          <ProfileAvatar name={parent.full_name} photoUrl={parent.photo_url} size="lg" />
          <PageHeader eyebrow="Veliler" title={parent.full_name} description={parent.email ?? parent.phone ?? "İletişim bilgisi yok"} />
        </div>
        {canEdit ? (
          <Link href={`/veliler/${parent.id}/duzenle`} className={cn(buttonVariants())}>
            <Pencil className="size-4" aria-hidden="true" />
            Düzenle
          </Link>
        ) : null}
      </div>
      <ParentErrorMessage error={query.error} />
      {query.success ? <SuccessMessage success={query.success} /> : null}
      <ProfileInfoCard profile={{ ...parent, department: null }} />
      <ProfileAuthManagement
        profile={parent}
        source="veliler"
        canManage={canManageAuth}
        createAuthAction={createProfileAuthAccountAction}
        resetPasswordAction={resetProfileAuthPasswordAction}
      />
      <ParentLinkedStudentsCard parent={parent} showManageButton={canManage} />
    </div>
  );
}

function SuccessMessage({ success }: { success: string }) {
  const messages: Record<string, string> = {
    "auth-created": "Auth hesabı oluşturuldu.",
    "auth-linked": "Auth hesabı profile bağlandı.",
    "password-reset": "Şifre başarıyla güncellendi.",
    "profile-updated": "Veli profili güncellendi.",
  };

  return <div className="rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary">{messages[success] ?? success}</div>;
}
