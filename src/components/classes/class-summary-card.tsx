import Link from "next/link";
import type { ComponentType } from "react";
import { CalendarDays, UsersRound } from "lucide-react";

import { ProgressMeter } from "@/components/departments/progress-meter";
import { RichProfileCard } from "@/components/profiles/rich-profile-card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ClassAnalytics } from "@/lib/departments/analytics";

export function ClassSummaryCard({ classRow, showStudentsLink = true }: { classRow: ClassAnalytics; showStudentsLink?: boolean }) {
  return (
    <Card className="bg-white">
      <CardHeader className="border-b border-border">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="truncate">{classRow.name}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{classRow.department?.name ?? "Bölüm yok"}</p>
          </div>
          <Badge variant={classRow.is_active ? "default" : "outline"}>{classRow.is_active ? "Aktif" : "Pasif"}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        <RichProfileCard
          profile={classRow.class_teacher}
          title="Sınıf Hocası"
          href={classRow.class_teacher ? `/hocalar/${classRow.class_teacher.id}` : undefined}
          emptyText="Sınıf hocası atanmadı"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Stat label="Aktif talebe" value={classRow.active_student_count} icon={UsersRound} />
          <Stat label="Ders sayısı" value={classRow.active_course_count} icon={CalendarDays} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <ProgressMeter label="Doluluk" value={classRow.occupancy_percent} />
          <ProgressMeter label="Başarı" value={classRow.success_average} muted="Henüz not verisi yok" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={classRow.has_schedule ? "default" : "outline"}>
            {classRow.has_schedule ? "Ders programı var" : "Ders programı yok"}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/siniflar/${classRow.id}`} className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}>
            Sınıf Detayı
          </Link>
          <Link href={`/egitim-planlama/ders-programi/${classRow.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Ders Programı
          </Link>
          {showStudentsLink ? (
            <Link href={`/talebeler?class=${classRow.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              Talebeler
            </Link>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
}) {
  return (
    <div className="rounded-md border border-border bg-[#f8fafc] p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <Icon className="size-4 text-[#093657]" aria-hidden />
      </div>
      <p className="mt-2 text-xl font-semibold text-[#093657]">{value}</p>
    </div>
  );
}
