import { PageHeader } from "@/components/layout/page-header";
import { AcademicTermCreateForm } from "@/components/terms/academic-term-create-form";
import { AcademicTermManagementCards } from "@/components/terms/academic-term-management-cards";
import { AcademicTermsManagementTable } from "@/components/terms/academic-terms-management-table";
import { requireRouteAccess } from "@/lib/auth";
import { listAcademicTermsAction } from "@/lib/terms/management-actions";

export default async function AcademicTermManagementPage() {
  await requireRouteAccess("/sistem/donem-yonetimi");
  const overview = await listAcademicTermsAction();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Sistem Yönetimi"
        title="Dönem Yönetimi"
        description="Akademik dönemleri görüntüleyin, kapalı dönem geçmişini inceleyin ve aktif dönem yokken yeni dönem başlatın."
      />

      <AcademicTermManagementCards summary={overview.summary} />
      <AcademicTermCreateForm />
      <AcademicTermsManagementTable terms={overview.terms} />
    </div>
  );
}
