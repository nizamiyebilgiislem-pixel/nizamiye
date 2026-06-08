import Link from "next/link";
import { redirect } from "next/navigation";

import { DormitoryOccupancyBars } from "@/components/dormitory/dormitory-occupancy-bars";
import { DormitorySummaryGrid } from "@/components/dormitory/dormitory-summary-grid";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth";
import { canViewDormitoryReports } from "@/lib/dormitory/permissions";
import { getDormitoryReportData } from "@/lib/dormitory/queries";

export default async function DormitoryReportsPage() {
  const { profile } = await requireAuth();
  if (!canViewDormitoryReports(profile)) {
    redirect("/veli");
  }

  const report = await getDormitoryReportData(profile);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Yatakhane" title="Raporlar" description="Yatakhane doluluk ve yerleşim özetleri." />

      <DormitorySummaryGrid
        items={[
          { label: "Toplam yatakhane", value: report.totalDormitoryCount },
          { label: "Toplam oda", value: report.totalRoomCount },
          { label: "Toplam yatak", value: report.totalBedCount },
          { label: "Doluluk", value: `%${report.occupancyPercent}` },
        ]}
      />

      <section className="grid gap-4 xl:grid-cols-2">
        <DormitoryOccupancyBars
          title="Katlara göre doluluk"
          items={report.floorDistribution.map((item) => ({
            label: item.name,
            percent: item.percent,
            detail: `${item.occupied} / ${item.total}`,
          }))}
        />
        <DormitoryOccupancyBars
          title="Bölümlere göre yerleşim"
          items={report.departmentDistribution.map((item) => ({
            label: item.name,
            percent: item.percent,
            detail: `${item.occupied} / ${item.total}`,
          }))}
        />
      </section>

      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle>PDF Merkezi Bağlantıları</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 p-4">
          <Link href="/raporlar/talebeler" className="text-sm font-medium text-[#093657] hover:underline">
            Talebe Raporları
          </Link>
          <Link href="/raporlar/siniflar" className="text-sm font-medium text-[#093657] hover:underline">
            Sınıf Raporları
          </Link>
          <Link href="/raporlar/bolumler" className="text-sm font-medium text-[#093657] hover:underline">
            Bölüm Raporları
          </Link>
          <Link href="/raporlar/yoklama" className="text-sm font-medium text-[#093657] hover:underline">
            Yoklama Raporları
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
