import Link from "next/link";
import { BedDouble, Building2, UsersRound } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DormitoryDashboard } from "@/lib/dormitory/queries";

export function DormitoryDashboardCard({ dashboard }: { dashboard: DormitoryDashboard }) {
  return (
    <Card size="sm" className="border-[#093657]/15 bg-white">
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Yatakhane</CardTitle>
          <Link href="/yatakhane" className="text-sm font-medium text-[#093657] hover:underline">
            Tümü
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MiniStat label="Dolu yatak" value={dashboard.occupiedBedCount} icon={BedDouble} />
          <MiniStat label="Boş yatak" value={dashboard.emptyBedCount} icon={BedDouble} />
          <MiniStat label="Doluluk" value={`%${dashboard.occupancyPercent}`} icon={Building2} />
          <MiniStat label="Yataksız talebe" value={dashboard.unassignedActiveStudentCount} icon={UsersRound} />
        </div>
        <div className="h-2 rounded-full bg-[#eaf1f6]">
          <div className="h-2 rounded-full bg-[#093657]" style={{ width: `${Math.max(4, Math.min(100, dashboard.occupancyPercent))}%` }} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/yatakhane/yerlesim" className={cn("rounded-md border border-[#093657]/15 px-3 py-2 text-sm font-medium text-[#093657] hover:bg-[#f4f8fc]")}>
            Yerleşimler
          </Link>
          <Link href="/yatakhane/raporlar" className={cn("rounded-md border border-[#093657]/15 px-3 py-2 text-sm font-medium text-[#093657] hover:bg-[#f4f8fc]")}>
            Raporlar
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function MiniStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: typeof BedDouble;
}) {
  return (
    <div className="rounded-md border border-border bg-[#f8fafc] p-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" aria-hidden="true" />
        <p className="text-xs font-medium">{label}</p>
      </div>
      <p className="mt-2 text-xl font-semibold text-[#093657]">{value}</p>
    </div>
  );
}
