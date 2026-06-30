import type { ComponentType } from "react";

import { Card, CardContent } from "@/components/ui/card";

type MetricCardProps = {
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  value: number;
};

export function MetricCard({ icon: Icon, label, value }: MetricCardProps) {
  return (
    <Card className="border-[#e5e7eb] bg-white">
      <CardContent className="flex items-center gap-2.5 p-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-[#eaf1f6]">
          <Icon className="size-4 text-[#093657]" aria-hidden />
        </div>
        <div className="flex flex-1 items-center justify-between gap-2">
          <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
          <p className="text-sm font-semibold text-[#093657]">{value.toLocaleString("tr-TR")}</p>
        </div>
      </CardContent>
    </Card>
  );
}
