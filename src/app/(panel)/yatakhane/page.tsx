import Link from "next/link";
import { Bed, Plus } from "lucide-react";

import { DormitoryCard } from "@/components/dormitory/dormitory-card";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireAuth } from "@/lib/auth";
import { canManageDormitories } from "@/lib/dormitory/permissions";
import { getDormitories, getDormitoryAssignmentCount, getDormitoryDashboardData, getUnassignedStudentsCount } from "@/lib/dormitory/queries";
import { cn } from "@/lib/utils";

export default async function DormitoryListPage() {
  const { profile } = await requireAuth();
  const canManage = canManageDormitories(profile);
  const allDormitories = await getDormitories(profile);
  const dashboardData = await getDormitoryDashboardData(profile);
  const unassignedCount = await getUnassignedStudentsCount(profile);

  const dormitoriesWithCount = await Promise.all(
    allDormitories.map(async (dormitory) => {
      const count = await getDormitoryAssignmentCount(dormitory.id);
      return { ...dormitory, assignment_count: count };
    }),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader
          eyebrow="Yönetim"
          title="Yatakhane Yönetimi"
          description="Yatakhaneleri görüntüleyin ve öğrenci yerleşimlerini yönetin."
        />
        {canManage && (
          <Link href="/yatakhane/yeni" className={cn(buttonVariants())}>
            <Plus className="size-4" aria-hidden="true" />
            Yeni Yatakhane
          </Link>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <SummaryCard label="Toplam Yatakhane" value={String(dashboardData.totalDormitories)} />
        <SummaryCard label="Toplam Kapasite" value={String(dashboardData.totalCapacity)} />
        <SummaryCard label="Yerleşen Talebe" value={String(dashboardData.assignedCount)} />
        <SummaryCard label="Boş Kontenjan" value={String(dashboardData.availableCapacity)} />
        <SummaryCard label="Yataksız Talebe" value={String(unassignedCount)} color={unassignedCount > 0 ? "amber" : "default"} />
      </div>

      {dormitoriesWithCount.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dormitoriesWithCount.map((dormitory) => (
            <DormitoryCard key={dormitory.id} dormitory={dormitory} assignedCount={dormitory.assignment_count ?? 0} canManage={canManage} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Bed}
          title="Henüz yatakhane bulunmamaktadır."
          description="Yeni bir yatakhane ekleyerek başlayın."
          action={canManage ? <Link href="/yatakhane/yeni" className={cn(buttonVariants())}><Plus className="size-4" aria-hidden="true" />Yeni Yatakhane</Link> : undefined}
        />
      )}
    </div>
  );
}

function SummaryCard({ label, value, color = "default" }: { label: string; value: string; color?: "default" | "amber" }) {
  return (
    <Card>
      <CardContent className="p-4 text-center">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn("mt-0.5 text-2xl font-semibold", color === "amber" ? "text-amber-600" : "text-[#093657]")}>{value}</p>
      </CardContent>
    </Card>
  );
}
