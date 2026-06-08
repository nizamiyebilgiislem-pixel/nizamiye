import { PageHeader } from "@/components/layout/page-header";
import { ProfileEmptyState } from "@/components/profiles/profile-empty-state";
import { ProfileErrorMessage } from "@/components/profiles/profile-error-message";
import { ProfileFilters } from "@/components/profiles/profile-filters";
import { ProfileListTable } from "@/components/profiles/profile-list-table";
import { requireRole } from "@/lib/auth";
import { getProfilesForCurrentProfile } from "@/lib/profiles/queries";
import { roles } from "@/types/rbac";

type UsersPageProps = {
  searchParams: Promise<{
    q?: string;
    role?: string;
    department?: string;
    status?: string;
    error?: string;
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
      <ProfileFilters
        actionPath="/kullanicilar"
        departments={departments}
        roleOptions={[...roles]}
        values={{ search: params.q, role: params.role, departmentId: params.department, status: params.status }}
      />
      {profiles.length > 0 ? (
        <ProfileListTable profiles={profiles} currentProfile={profile} detailBasePath="/kullanicilar" showCreatedAt />
      ) : (
        <ProfileEmptyState title="Kullanıcı profili bulunamadı" description="Filtreleri değiştirerek tekrar deneyin." />
      )}
    </div>
  );
}
