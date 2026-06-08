import { GradeErrorMessage } from "@/components/grades/grade-error-message";
import { PageHeader } from "@/components/layout/page-header";
import { TermsManager } from "@/components/terms/terms-manager";
import { requireAuth } from "@/lib/auth";
import { canManageGradeSettings } from "@/lib/grades/permissions";
import { getAcademicTerms } from "@/lib/terms/queries";

type TermsPageProps = { searchParams: Promise<{ error?: string; saved?: string }> };

export default async function TermsPage({ searchParams }: TermsPageProps) {
  const params = await searchParams;
  const { profile } = await requireAuth();
  const terms = await getAcademicTerms();

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Not Sistemi" title="Dönemler" description="Akademik dönemleri görüntüleyin ve yetkiniz varsa yönetin." />
      <GradeErrorMessage error={params.error} />
      {params.saved ? <div className="rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary">Dönem kaydedildi.</div> : null}
      <TermsManager terms={terms} canManage={canManageGradeSettings(profile)} />
    </div>
  );
}
