import { notFound } from "next/navigation";
import { ArrowLeft, Bed, Plus } from "lucide-react";

import { DormitoryDetailPanel } from "@/components/dormitory/dormitory-detail-panel";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth";
import { canManageDormitories } from "@/lib/dormitory/permissions";
import { getDormitoryById, getDormitoryAssignmentCount, getActiveAssignmentsByDormitory } from "@/lib/dormitory/queries";
import { cn } from "@/lib/utils";
import Link from "next/link";

type DormitoryDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function DormitoryDetailPage({ params }: DormitoryDetailPageProps) {
  const { id } = await params;
  const { profile } = await requireAuth();
  const dormitory = await getDormitoryById(id);

  if (!dormitory) {
    notFound();
  }

  const canManage = canManageDormitories(profile);
  const assignedCount = await getDormitoryAssignmentCount(id);
  const assignments = await getActiveAssignmentsByDormitory(id);

  const isFull = assignedCount >= dormitory.capacity;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-4">
          <Link href="/yatakhane" className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "mt-1 shrink-0")}>
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-[#eaf1f6]">
              <Bed className="size-5 text-[#093657]" aria-hidden />
            </div>
            <PageHeader
              eyebrow={dormitory.department?.name ?? "Yatakhane"}
              title={dormitory.name}
              description={`Kapasite: ${dormitory.capacity} · Yerleşen: ${assignedCount} · ${dormitory.is_active ? "Aktif" : "Pasif"}`}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canManage && !isFull && (
            <Link href={`/yatakhane/${dormitory.id}/yerlestir`} className={cn(buttonVariants())}>
              <Plus className="size-4" aria-hidden="true" />
              Öğrenci Yerleştir
            </Link>
          )}
        </div>
      </div>

      <DormitoryDetailPanel
        dormitory={dormitory}
        assignments={assignments}
        assignedCount={assignedCount}
        canManage={canManage}
      />
    </div>
  );
}
