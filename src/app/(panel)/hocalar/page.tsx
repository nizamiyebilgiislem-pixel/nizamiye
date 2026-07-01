import Link from "next/link";
import { Plus } from "lucide-react";

import { CsvExportButton } from "@/components/export/csv-export-button";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ProfileErrorMessage } from "@/components/profiles/profile-error-message";
import { ProfileFilters } from "@/components/profiles/profile-filters";
import { ProfileListTable } from "@/components/profiles/profile-list-table";
import { buttonVariants } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth";
import { canCreateStaffProfile, staffProfileRoles } from "@/lib/profiles/permissions";
import { getProfilesForCurrentProfile } from "@/lib/profiles/queries";
import { cn } from "@/lib/utils";

type TeachersPageProps = {
  searchParams: Promise<{
    q?: string;
    role?: string;
    department?: string;
    status?: string;
    error?: string;
  }>;
};

export default async function TeachersPage({ searchParams }: TeachersPageProps) {
  const params = await searchParams;
  const { profile } = await requireAuth();
  const { profiles, departments } = await getProfilesForCurrentProfile(profile, {
    search: params.q,
    role: params.role,
    departmentId: params.department,
    status: params.status,
    staffOnly: true,
  });
  const csvData = profiles.map((p) => ({
    "Ad Soyad": p.full_name,
    "E-posta": p.email ?? "",
    "Telefon": p.phone ?? "",
    "Rol": p.role,
    "Bölüm": p.department?.name ?? "",
    "Durum": p.is_active ? "Aktif" : "Pasif",
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Hocalar"
        title="Hocalar"
        description="Hoca, bölüm müdürü ve genel müdür profillerini görüntüleyin."
        actions={<div className="flex flex-wrap gap-2">{canCreateStaffProfile(profile) ? <Link href="/hocalar/yeni" className={cn(buttonVariants())}><Plus className="size-4" aria-hidden="true" />Yeni Hoca Ekle</Link> : null}<CsvExportButton data={csvData} filename="hocalar" /></div>}
      />

      <ProfileErrorMessage error={params.error} />
      <ProfileFilters
        actionPath="/hocalar"
        departments={departments}
        roleOptions={staffProfileRoles}
        values={{ search: params.q, role: params.role, departmentId: params.department, status: params.status }}
      />
      {profiles.length > 0 ? (
        <ProfileListTable profiles={profiles} currentProfile={profile} detailBasePath="/hocalar" showEdit />
      ) : (
        <EmptyState title="Profil bulunamadı" description="Filtreleri değiştirin veya yetkiniz varsa yeni profil ekleyin." />
      )}
    </div>
  );
}
