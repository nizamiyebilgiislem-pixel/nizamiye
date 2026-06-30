import Link from "next/link";
import { Plus } from "lucide-react";

import { InfirmaryErrorMessage } from "@/components/infirmary/infirmary-error-message";
import { InfirmaryList } from "@/components/infirmary/infirmary-list";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth";
import { getInfirmaryDashboardSummary } from "@/lib/infirmary/queries";
import { canManageInfirmary } from "@/lib/module-assignments/permissions";
import { cn } from "@/lib/utils";

type InfirmaryPageProps = { searchParams: Promise<{ error?: string }> };

export default async function InfirmaryPage({ searchParams }: InfirmaryPageProps) {
  const params = await searchParams;
  const { profile } = await requireAuth();
  const canManage = await canManageInfirmary(profile);
  const summary = await getInfirmaryDashboardSummary(profile);
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Revir"
        title="Revir Sistemi"
        description="Talebe revir kayıtlarını takip edin."
        actions={<><Link href="/revir/kayitlar" className={cn(buttonVariants({ variant: "secondary" }))}>Tüm Kayıtlar</Link>{canManage ? <Link href="/revir/yeni" className={cn(buttonVariants())}><Plus className="size-4" aria-hidden="true" />Yeni Revir Kaydı</Link> : null}</>}
      />
      <InfirmaryErrorMessage error={params.error} />
      <section className="grid gap-4 md:grid-cols-4">
        <Metric label="Toplam Kayıt" value={summary.totalCount} />
        <Metric label="Bugünkü Kayıt" value={summary.todayCount} />
        <Metric label="Hastaneye Sevk" value={summary.hospitalCount} />
        <Metric label="Veli Bilgilendirildi" value={summary.parentInformedCount} />
      </section>
      <div>
        <h2 className="mb-3 text-lg font-semibold">Son 10 Revir Kaydı</h2>
        <InfirmaryList records={summary.latestRecords} profile={profile} canManageAll={canManage} />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-semibold">{value}</p></CardContent></Card>;
}
