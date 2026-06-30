import Link from "next/link";

import { DepartmentCard } from "@/components/departments/department-card";
import { DepartmentErrorMessage } from "@/components/departments/department-error-message";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireAuth } from "@/lib/auth";
import { getDepartmentAnalyticsForProfile } from "@/lib/departments/analytics";
import { canManageDepartments } from "@/lib/departments/permissions";
import { cn } from "@/lib/utils";

type DepartmentsPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function DepartmentsPage({ searchParams }: DepartmentsPageProps) {
  const params = await searchParams;
  const { profile } = await requireAuth();
  const departments = await getDepartmentAnalyticsForProfile(profile);
  const canCreate = canManageDepartments(profile);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <PageHeader
          eyebrow="Bölümler"
          title="Bölüm Yönetimi"
          description="Bölümlerin müdür, sınıf, talebe, doluluk ve başarı durumunu tek ekrandan izleyin."
        />
        {canCreate ? (
          <Link href="/bolumler/yeni" className={cn(buttonVariants())}>
            Yeni Bölüm
          </Link>
        ) : null}
      </div>

      <DepartmentErrorMessage error={params.error} />

      {departments.length > 0 ? (
        <section className="grid gap-4 xl:grid-cols-2">
          {departments.map((department) => (
            <DepartmentCard key={department.id} department={department} canEdit={canCreate} />
          ))}
        </section>
      ) : (
        <EmptyState title="Görüntülenecek bölüm bulunamadı." />
      )}
    </div>
  );
}
