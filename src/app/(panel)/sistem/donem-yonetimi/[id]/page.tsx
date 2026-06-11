import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { AcademicTermDetailPanel } from "@/components/terms/academic-term-detail-panel";
import { buttonVariants } from "@/components/ui/button";
import { requireRouteAccess } from "@/lib/auth";
import { getAcademicTermDetailAction } from "@/lib/terms/management-actions";
import { cn } from "@/lib/utils";

type AcademicTermDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AcademicTermDetailPage({ params }: AcademicTermDetailPageProps) {
  const { id } = await params;
  await requireRouteAccess("/sistem/donem-yonetimi/[id]");

  const detail = await getAcademicTermDetailAction(id);
  if (!detail) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          eyebrow="Dönem Geçmişi"
          title={detail.name}
          description="Dönem bilgileri, snapshot sayıları ve kapanış durumu salt okunur olarak gösterilir."
        />
        <Link href="/sistem/donem-yonetimi" className={cn(buttonVariants({ variant: "outline" }))}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Dönem Yönetimi
        </Link>
      </div>

      <AcademicTermDetailPanel detail={detail} />
    </div>
  );
}
