import Link from "next/link";
import { Video } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

type LiveSessionDashboardCardProps = {
  upcomingCount: number;
};

export function LiveSessionDashboardCard({ upcomingCount }: LiveSessionDashboardCardProps) {
  return (
    <Link href="/canli-oturumlar">
      <Card className="border-[#e5e7eb] bg-white transition-colors hover:bg-[#f8fafc]">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#eaf1f6]">
            <Video className="size-5 text-[#093657]" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold leading-tight text-[#093657]">{upcomingCount}</p>
            <p className="truncate text-xs text-muted-foreground">Yaklaşan Canlı Oturum</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
