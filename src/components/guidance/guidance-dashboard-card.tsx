import Link from "next/link";
import { HeartHandshake } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type GuidanceDashboardCardProps = {
  totalInterviews: number;
  openFollowUps: number;
  thisMonthInterviews: number;
  activeSurveys: number;
  plannedActivities: number;
};

export function GuidanceDashboardCard({
  totalInterviews,
  openFollowUps,
  thisMonthInterviews,
  activeSurveys,
  plannedActivities,
}: GuidanceDashboardCardProps) {
  return (
    <Link href="/rehberlik" className="block">
      <Card className="h-full border-[#e5e7eb] bg-white transition-shadow hover:shadow-md">
        <CardHeader className="flex flex-row items-center gap-3 border-b border-border pb-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-[#eaf1f6]">
            <HeartHandshake className="size-5 text-[#093657]" aria-hidden />
          </div>
          <div>
            <CardTitle className="text-sm">Rehberlik Özeti</CardTitle>
            <CardDescription className="text-xs">{totalInterviews} toplam görüşme</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 p-4">
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <p className="text-muted-foreground">Bu Ay</p>
              <p className="mt-0.5 text-base font-semibold text-[#093657]">{thisMonthInterviews}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Açık Takip</p>
              <p className="mt-0.5 text-base font-semibold text-[#093657]">{openFollowUps}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Anket</p>
              <p className="mt-0.5 text-base font-semibold text-[#093657]">{activeSurveys}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            {plannedActivities > 0 && (
              <span className="inline-flex items-center rounded-md bg-[#eaf1f6] px-2 py-1 text-xs font-medium text-[#093657]">
                {plannedActivities} planlanan etkinlik
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
