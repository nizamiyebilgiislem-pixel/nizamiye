import Link from "next/link";
import { Plus } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { ClassErrorMessage } from "@/components/classes/class-error-message";
import { ClassFilters } from "@/components/classes/class-filters";
import { ClassListTable } from "@/components/classes/class-list-table";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth";
import { canManageClasses } from "@/lib/classes/permissions";
import { getClassesForProfile } from "@/lib/classes/queries";
import { cn } from "@/lib/utils";

type ClassesPageProps = {
  searchParams: Promise<{
    q?: string;
    department?: string;
    status?: string;
    error?: string;
  }>;
};

export default async function ClassesPage({ searchParams }: ClassesPageProps) {
  const params = await searchParams;
  const { profile } = await requireAuth();
  const { classes, departments } = await getClassesForProfile(profile, {
    search: params.q,
    departmentId: params.department,
    status: params.status,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <PageHeader
          eyebrow="Sınıflar"
          title="Sınıflar"
          description="Bölüm bazlı sınıfları, sınıf hocası atamalarını ve aktif talebe sayılarını yönetin."
        />
        {canManageClasses(profile) ? (
          <Link href="/siniflar/yeni" className={cn(buttonVariants())}>
            <Plus className="size-4" aria-hidden="true" />
            Yeni Sınıf Ekle
          </Link>
        ) : null}
      </div>
      <ClassErrorMessage error={params.error} />
      <ClassFilters departments={departments} values={{ search: params.q, departmentId: params.department, status: params.status }} />
      {classes.length > 0 ? (
        <ClassListTable classes={classes} profile={profile} />
      ) : (
        <EmptyState title="Sınıf bulunamadı" description="Filtreleri değiştirin veya yetkiniz varsa yeni sınıf ekleyin." />
      )}
    </div>
  );
}
