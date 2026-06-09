import Link from "next/link";
import { Edit3, Eye } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DormitoryWithDepartment } from "@/lib/dormitory/queries";

type DormitoryCardProps = {
  dormitory: DormitoryWithDepartment;
  assignedCount: number;
  canManage: boolean;
};

export function DormitoryCard({ dormitory, assignedCount, canManage }: DormitoryCardProps) {
  const available = dormitory.capacity - assignedCount;
  const occupancyPercent = dormitory.capacity > 0 ? Math.round((assignedCount / dormitory.capacity) * 100) : 0;
  const isFull = assignedCount >= dormitory.capacity;

  return (
    <Card className={cn("bg-white transition-shadow hover:shadow-md", !dormitory.is_active && "opacity-70")}>
      <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-3">
        <div className="min-w-0 flex-1">
          <CardTitle className="truncate text-base">{dormitory.name}</CardTitle>
          <p className="mt-0.5 text-xs text-muted-foreground">{dormitory.department?.name ?? "Bölüm yok"}</p>
        </div>
        {!dormitory.is_active && (
          <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            Pasif
          </span>
        )}
      </CardHeader>
      <CardContent className="space-y-3 p-4">
        <div className="grid grid-cols-3 gap-3 text-center text-sm">
          <div className="rounded-md bg-[#f8fafc] p-2">
            <p className="text-xs text-muted-foreground">Kapasite</p>
            <p className="mt-0.5 text-base font-semibold text-[#093657]">{dormitory.capacity}</p>
          </div>
          <div className="rounded-md bg-[#f8fafc] p-2">
            <p className="text-xs text-muted-foreground">Yerleşen</p>
            <p className="mt-0.5 text-base font-semibold text-[#093657]">{assignedCount}</p>
          </div>
          <div className="rounded-md bg-[#f8fafc] p-2">
            <p className="text-xs text-muted-foreground">Boş</p>
            <p className={cn("mt-0.5 text-base font-semibold", isFull ? "text-red-600" : "text-[#093657]")}>{Math.max(0, available)}</p>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Doluluk</span>
            <span className={cn("font-medium", isFull ? "text-red-600" : "text-[#093657]")}>%{occupancyPercent}</span>
          </div>
          <div className="h-2 rounded-full bg-[#eaf1f6]">
            <div
              className={cn("h-2 rounded-full transition-all", isFull ? "bg-red-500" : "bg-[#093657]")}
              style={{ width: `${Math.min(100, Math.max(4, occupancyPercent))}%` }}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Link href={`/yatakhane/${dormitory.id}`} className={cn(buttonVariants({ size: "sm", variant: "outline" }), "flex-1")}>
            <Eye className="size-3.5" aria-hidden="true" />
            Detay
          </Link>
          {canManage && (
            <Link href={`/yatakhane/${dormitory.id}/duzenle`} className={cn(buttonVariants({ size: "sm", variant: "outline" }), "flex-1")}>
              <Edit3 className="size-3.5" aria-hidden="true" />
              Düzenle
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
