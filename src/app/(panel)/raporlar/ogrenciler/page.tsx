import Link from "next/link";
import { Download, FileText, UsersRound } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { StudentCompactCard } from "@/components/students/student-compact-card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireAuth } from "@/lib/auth";
import { getStudentBulkReportScope } from "@/lib/reports/student-bulk-pdf";
import { cn } from "@/lib/utils";
import { isGlobalViewRole } from "@/types/rbac";

type StudentReportsPageProps = {
  searchParams: Promise<{ departmentId?: string; classId?: string }>;
};

export default async function StudentReportsPage({ searchParams }: StudentReportsPageProps) {
  const [{ profile }, query] = await Promise.all([requireAuth(), searchParams]);
  const selectedDepartmentId = query.departmentId || null;
  const selectedClassId = query.classId || null;
  const scope = await getStudentBulkReportScope(profile, {
    departmentId: selectedDepartmentId,
    classId: selectedClassId,
  });
  const baseScope = await getStudentBulkReportScope(profile);
  const filterClasses = selectedDepartmentId
    ? baseScope.classes.filter((classRow) => classRow.department_id === selectedDepartmentId)
    : baseScope.classes;
  const bulkPdfHref = buildBulkPdfHref({ departmentId: selectedDepartmentId, classId: selectedClassId });
  const showDepartmentFilter = isGlobalViewRole(profile.role);
  const showClassFilter = isGlobalViewRole(profile.role) || profile.role === "bolum_muduru";
  const groupedClasses = scope.classes.map((classRow) => ({
    classRow,
    students: scope.students.filter((student) => student.course_class_id === classRow.id),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="PDF Merkezi"
        title="Talebe Raporlari"
        description="Yetki kapsaminizdaki aktif talebelerin detayli profil PDF ciktisini alin."
        actions={
          scope.students.length > 0 ? (
            <a
              href={bulkPdfHref}
              className={cn(buttonVariants({ variant: "default", size: "sm" }))}
              download
            >
              <Download className="size-4" aria-hidden="true" />
              Toplu PDF İndir
            </a>
          ) : null
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="Talebe" value={scope.students.length} />
        <MiniStat label="Sinif" value={scope.classes.length} />
        <MiniStat label="Bolum" value={scope.departments.length} />
        <MiniStat label="Kapsam" value={scope.scopeLabel} />
      </section>

      {(showDepartmentFilter || showClassFilter) && (
        <Card className="bg-white">
          <CardContent className="p-4">
            <form className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto] md:items-end">
              {showDepartmentFilter ? (
                <label className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">Bolum</span>
                  <select
                    name="departmentId"
                    defaultValue={selectedDepartmentId ?? ""}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="">Tum bolumler</option>
                    {baseScope.departments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              {showClassFilter ? (
                <label className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">Sinif</span>
                  <select
                    name="classId"
                    defaultValue={selectedClassId ?? ""}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="">Tum siniflar</option>
                    {filterClasses.map((classRow) => (
                      <option key={classRow.id} value={classRow.id}>
                        {classRow.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              <button type="submit" className={cn(buttonVariants({ variant: "default", size: "sm" }))}>
                Filtrele
              </button>
              <Link href="/raporlar/ogrenciler" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                Temizle
              </Link>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="bg-white">
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[#eaf1f6]">
              <FileText className="size-5 text-[#093657]" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#093657]">Tek tik toplu PDF</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Her talebe ayri sayfada; notlar, kanaat/yorum, hoca notlari ve diger profil ozetleriyle indirilir.
              </p>
            </div>
          </div>
          {scope.students.length > 0 ? (
            <a
              href={bulkPdfHref}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              download
            >
              <Download className="size-4" aria-hidden="true" />
              Tüm Kapsamı İndir
            </a>
          ) : null}
        </CardContent>
      </Card>

      {groupedClasses.length > 0 ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {groupedClasses.map(({ classRow, students }) => (
            <Card key={classRow.id} className="bg-white">
              <CardContent className="space-y-4 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-[#093657]">{classRow.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      {scope.departments.find((department) => department.id === classRow.department_id)?.name ?? "Bolum yok"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{students.length} talebe</Badge>
                    {students.length > 0 ? (
                      <a
                        href={`/api/reports/students/bulk-pdf?classId=${classRow.id}`}
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                        download
                      >
                        <Download className="size-4" aria-hidden="true" />
                        Sınıf PDF İndir
                      </a>
                    ) : null}
                  </div>
                </div>

                {students.length > 0 ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    {students.slice(0, 6).map((student) => (
                      <StudentCompactCard key={student.id} student={student} />
                    ))}
                  </div>
                ) : (
                  <EmptyState title="Bu sinif icin aktif talebe yok." />
                )}

                {students.length > 6 ? <p className="text-xs text-muted-foreground">+ {students.length - 6} talebe daha</p> : null}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="Yetki kapsaminizda raporlanacak aktif talebe bulunamadi." />
      )}
    </div>
  );
}

function buildBulkPdfHref(filters: { departmentId?: string | null; classId?: string | null }) {
  const params = new URLSearchParams();
  if (filters.departmentId) params.set("departmentId", filters.departmentId);
  if (filters.classId) params.set("classId", filters.classId);
  const query = params.toString();
  return query ? `/api/reports/students/bulk-pdf?${query}` : "/api/reports/students/bulk-pdf";
}

function MiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <Card size="sm" className="bg-white">
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[#eaf1f6]">
          <UsersRound className="size-4 text-[#093657]" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="truncate text-sm font-semibold text-[#093657]">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
