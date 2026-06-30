import { Printer, FileText } from "lucide-react";

import { ReportCard } from "@/components/reports/report-card";
import { ReportPrintActions } from "@/components/reports/report-print-actions";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireAuth } from "@/lib/auth";
import { reportCategories } from "@/lib/reports/constants";
import {
  canViewStudentReports,
  canViewClassReports,
  canViewDepartmentReports,
  canViewGradeReports,
  canViewAttendanceReports,
  canViewEvaluationReports,
  canViewInfirmaryReports,
  canViewDormitoryReports,
  canViewLibraryReports,
  canViewGuidanceReports,
  canViewTaskReports,
  canViewRequestReports,
  canViewDocumentReports,
} from "@/lib/reports/permissions";
import { getActiveTerms } from "@/lib/terms/queries";

const permissionMap: Record<string, (profile: import("@/types/database").ProfileRow) => boolean | Promise<boolean>> = {
  student: canViewStudentReports,
  class: canViewClassReports,
  department: canViewDepartmentReports,
  grade: canViewGradeReports,
  attendance: canViewAttendanceReports,
  evaluation: canViewEvaluationReports,
  infirmary: canViewInfirmaryReports,
  dormitory: canViewDormitoryReports,
  library: canViewLibraryReports,
  guidance: canViewGuidanceReports,
  task: canViewTaskReports,
  request: canViewRequestReports,
  document: canViewDocumentReports,
};

export default async function ReportsPage() {
  const { profile } = await requireAuth();
  const activeTerms = await getActiveTerms();
  const activeTerm = activeTerms[0] ?? null;

  const visibleCategories = [];
  for (const cat of reportCategories) {
    const checker = permissionMap[cat.permissionKey];
    if (checker) {
      const result = await Promise.resolve(checker(profile));
      if (result) {
        visibleCategories.push(cat);
      }
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Yönetim"
        title="Rapor Merkezi"
        description="Kurum çıktılarını, resmi PDF görünümünü ve dönemsel özetleri tek merkezden yönetin."
        actions={<ReportPrintActions backHref="/dashboard" />}
      />

      <Card size="sm" className="border-[#093657]/15 bg-white">
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Aktif dönem</p>
            <p className="text-xl font-semibold text-[#093657]">{activeTerm?.name ?? "Aktif dönem tanımlı değil"}</p>
          </div>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Raporlar yetki kapsamınıza göre filtrelenir. Resmi çıktı almak için ilgili rapor kategorisini açın.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visibleCategories.map((cat) => (
          <ReportCard
            key={cat.key}
            title={cat.title}
            description={cat.description}
            href={cat.href}
            icon={cat.icon}
            badge={cat.badge}
            roles={cat.roles}
          />
        ))}
      </div>

      {visibleCategories.length === 0 && (
        <EmptyState title="Yetki kapsamınızda görüntüleyebileceğiniz rapor bulunmamaktadır." />
      )}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card size="sm" className="bg-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Printer className="size-4 text-[#093657]" aria-hidden />
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Yazdırılabilir</p>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Tüm rapor sayfaları <strong>PDF</strong> olarak yazdırılabilir. Raporu açın, &quot;Yazdır / PDF Al&quot; butonunu kullanın.
            </p>
          </CardContent>
        </Card>
        <Card size="sm" className="bg-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-[#093657]" aria-hidden />
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Filtreleme</p>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Her rapor sayfasında bölüm, sınıf, tarih aralığı ve durum filtreleri bulunur.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
