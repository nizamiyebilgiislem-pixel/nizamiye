import Link from "next/link";
import { Archive, Plus } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { StudentErrorMessage } from "@/components/students/student-error-message";
import { StudentFilters } from "@/components/students/student-filters";
import { StudentListTable } from "@/components/students/student-list-table";
import { buttonVariants } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth";
import { canCreateStudent, canViewArchive } from "@/lib/students/permissions";
import { getStudentsForProfile } from "@/lib/students/queries";
import { cn } from "@/lib/utils";

type StudentsPageProps = {
  searchParams: Promise<{
    q?: string;
    department?: string;
    class?: string;
    error?: string;
    page?: string;
  }>;
};

export default async function StudentsPage({ searchParams }: StudentsPageProps) {
  const params = await searchParams;
  const { profile } = await requireAuth();
  const page = Number(params.page) || 1;
  const { students, departments, classes, totalCount } = await getStudentsForProfile(
    profile,
    {
      search: params.q,
      departmentId: params.department,
      classId: params.class,
    },
    page,
  );

  const pageSize = 20;
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Talebeler"
        title="Aktif Talebeler"
        description="Aktif durumdaki talebeleri görüntüleyin, filtreleyin ve yetkiniz dahilinde yönetin."
        actions={<div className="flex flex-wrap gap-2">{canViewArchive(profile) ? <Link href="/talebeler/arsiv" className={cn(buttonVariants({ variant: "secondary" }))}><Archive className="size-4" aria-hidden="true" />Arşiv Talebeler</Link> : null}{canCreateStudent(profile) ? <Link href="/talebeler/yeni" className={cn(buttonVariants())}><Plus className="size-4" aria-hidden="true" />Yeni Talebe Ekle</Link> : null}</div>}
      />

      <StudentErrorMessage error={params.error} />
      <StudentFilters
        actionPath="/talebeler"
        departments={departments}
        classes={classes}
        values={{ search: params.q, departmentId: params.department, classId: params.class }}
      />

      {students.length > 0 ? (
        <>
          <StudentListTable students={students} profile={profile} />
          <Pagination currentPage={page} totalPages={totalPages} basePath="/talebeler" searchParams={params} />
        </>
      ) : (
        <EmptyState title="Aktif talebe bulunamadı" description="Filtreleri değiştirin veya yeni talebe ekleyin." />
      )}
    </div>
  );
}
