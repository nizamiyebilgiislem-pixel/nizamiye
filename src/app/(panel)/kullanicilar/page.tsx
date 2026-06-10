import Link from "next/link";
import { Plus } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { ProfileEmptyState } from "@/components/profiles/profile-empty-state";
import { ProfileErrorMessage } from "@/components/profiles/profile-error-message";
import { ProfileFilters } from "@/components/profiles/profile-filters";
import { ProfileListTable } from "@/components/profiles/profile-list-table";
import { buttonVariants } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import { getProfilesForCurrentProfile } from "@/lib/profiles/queries";
import { cn } from "@/lib/utils";
import { roles } from "@/types/rbac";

type UsersPageProps = {
  searchParams: Promise<{
    q?: string;
    role?: string;
    department?: string;
    status?: string;
    error?: string;
    success?: string;
  }>;
};

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const params = await searchParams;
  const { profile } = await requireRole(["admin", "genel_mudur"]);
  const { profiles, departments } = await getProfilesForCurrentProfile(profile, {
    search: params.q,
    role: params.role,
    departmentId: params.department,
    status: params.status,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Kullanıcılar"
        title="Kullanıcı Profilleri"
        description="Profiles tablosundaki tüm kullanıcı profillerini görüntüleyin."
      />
      <ProfileErrorMessage error={params.error} />
      {params.success ? <SuccessMessage success={params.success} /> : null}
      <div className="flex items-start justify-between gap-4">
        <ProfileFilters
          actionPath="/kullanicilar"
          departments={departments}
          roleOptions={[...roles]}
          values={{ search: params.q, role: params.role, departmentId: params.department, status: params.status }}
        />
        <Link href="/kullanicilar/yeni" className={cn(buttonVariants(), "shrink-0")}>
          <Plus className="mr-1.5 size-4" /> Yeni Kullanıcı
        </Link>
      </div>
      {profiles.length > 0 ? (
        <ProfileListTable profiles={profiles} currentProfile={profile} detailBasePath="/kullanicilar" showEdit showCreatedAt />
      ) : (
        <ProfileEmptyState title="Kullanıcı profili bulunamadı" description="Filtreleri değiştirerek tekrar deneyin." />
      )}
    </div>
  );
}

function SuccessMessage({ success }: { success: string }) {
  const messages: Record<string, string> = {
    deleted: "Kullanıcı başarıyla silindi.",
  };

  return <div className="rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary">{messages[success] ?? success}</div>;
}
