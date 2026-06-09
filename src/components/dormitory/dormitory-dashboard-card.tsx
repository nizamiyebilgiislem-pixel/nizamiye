import Link from "next/link";
import { Bed } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type DormitoryDashboardCardProps = {
  totalCapacity: number;
  assignedCount: number;
  availableCapacity: number;
  totalDormitories: number;
  unassignedStudents: number;
};

export function DormitoryDashboardCard({
  totalCapacity,
  assignedCount,
  availableCapacity,
  totalDormitories,
  unassignedStudents,
}: DormitoryDashboardCardProps) {
  const occupancyPercent = totalCapacity > 0 ? Math.round((assignedCount / totalCapacity) * 100) : 0;

  return (
    <Link href="/yatakhane" className="block">
      <Card className="h-full border-[#e5e7eb] bg-white transition-shadow hover:shadow-md">
        <CardHeader className="flex flex-row items-center gap-3 border-b border-border pb-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-[#eaf1f6]">
            <Bed className="size-5 text-[#093657]" aria-hidden />
          </div>
          <div>
            <CardTitle className="text-sm">Yatakhane Özeti</CardTitle>
            <CardDescription className="text-xs">{totalDormitories} yatakhane</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 p-4">
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <p className="text-muted-foreground">Kapasite</p>
              <p className="mt-0.5 text-base font-semibold text-[#093657]">{totalCapacity}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Yerleşen</p>
              <p className="mt-0.5 text-base font-semibold text-[#093657]">{assignedCount}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Boş</p>
              <p className={cn("mt-0.5 text-base font-semibold", availableCapacity === 0 ? "text-red-600" : "text-[#093657]")}>{availableCapacity}</p>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Doluluk</span>
              <span className={cn("font-medium", occupancyPercent >= 90 ? "text-red-600" : "text-[#093657]")}>%{occupancyPercent}</span>
            </div>
            <div className="h-2 rounded-full bg-[#eaf1f6]">
              <div
                className={cn("h-2 rounded-full transition-all", occupancyPercent >= 90 ? "bg-red-500" : "bg-[#093657]")}
                style={{ width: `${Math.min(100, Math.max(4, occupancyPercent))}%` }}
              />
            </div>
          </div>

          {unassignedStudents > 0 && (
            <p className="text-xs text-amber-600">
              {unassignedStudents} talebenin yatakhane kaydı bulunmamaktadır.
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
