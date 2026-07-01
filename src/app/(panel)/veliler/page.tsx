import Link from "next/link";
import { Plus } from "lucide-react";

import { CsvExportButton } from "@/components/export/csv-export-button";
import { PageHeader } from "@/components/layout/page-header";
import { ParentErrorMessage } from "@/components/parents/parent-error-message";
import { ParentFilters } from "@/components/parents/parent-filters";
import { ParentListTable } from "@/components/parents/parent-list-table";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth";
import { canCreateParentProfile } from "@/lib/parents/permissions";
import { getParentProfilesForProfile } from "@/lib/parents/queries";
import { cn } from "@/lib/utils";

type ParentsPageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    error?: string;
  }>;
};

export default async function ParentsPage({ searchParams }: ParentsPageProps) {
  const params = await searchParams;
  const { profile } = await requireAuth();
  const { parents } = await getParentProfilesForProfile(profile, {
    search: params.q,
    status: params.status,
  });
  const csvData = parents.map((p) => ({
    "Ad Soyad": p.full_name,
    "E-posta": p.email ?? "",
    "Telefon": p.phone ?? "",
    "Bağlı Talebe Sayısı": p.linked_student_count,
    "Durum": p.is_active ? "Aktif" : "Pasif",
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Veliler"
        title="Veli Yönetimi"
        description="Veli profillerini, auth bağlantılarını ve talebe ilişkilerini yönetin."
        actions={<div className="flex flex-wrap gap-2">{canCreateParentProfile(profile) ? <Link href="/veliler/yeni" className={cn(buttonVariants())}><Plus className="size-4" aria-hidden="true" />Yeni Veli Ekle</Link> : null}<CsvExportButton data={csvData} filename="veliler" /></div>}
      />
      <ParentErrorMessage error={params.error} />
      <ParentFilters actionPath="/veliler" values={{ search: params.q, status: params.status }} />
      {parents.length > 0 ? (
        <ParentListTable parents={parents} currentProfile={profile} />
      ) : (
        <EmptyState title="Veli bulunamadı" description="Filtreleri değiştirin veya yetkiniz varsa yeni veli ekleyin." />
      )}
    </div>
  );
}
