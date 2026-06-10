import Link from "next/link";
import { ListChecks } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type TaskDashboardCardProps = {
  openCount: number;
  overdueCount: number;
  dueTodayCount: number;
  completedCount: number;
};

export function TaskDashboardCard({ openCount, overdueCount, dueTodayCount, completedCount }: TaskDashboardCardProps) {
  const totalOpen = openCount + overdueCount;

  return (
    <Card className="bg-white">
      <CardHeader className="border-b border-border pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <ListChecks className="size-4 text-[#093657]" />
          Görevler
        </CardTitle>
        <CardDescription className="text-xs">Aktif görev durumu</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 p-3 pt-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Açık Görev</span>
          <span className="font-semibold text-[#093657]">{totalOpen}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Geciken</span>
          <span className="font-semibold text-red-600">{overdueCount}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Bugün Bitecek</span>
          <span className="font-semibold text-orange-600">{dueTodayCount}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Tamamlanan</span>
          <span className="font-semibold text-green-600">{completedCount}</span>
        </div>
        <Link
          href="/gorevler"
          className="mt-1 block text-center text-xs font-medium text-[#093657] underline underline-offset-2"
        >
          Tüm Görevler
        </Link>
      </CardContent>
    </Card>
  );
}
