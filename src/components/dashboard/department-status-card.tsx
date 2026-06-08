import Link from "next/link";
import { BookOpen, GraduationCap, LayoutGrid, UsersRound } from "lucide-react";

import { RichProfileCard } from "@/components/profiles/rich-profile-card";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DepartmentAnalytics } from "@/lib/departments/analytics";
import { cn } from "@/lib/utils";

type DepartmentStatusCardProps = {
  department: DepartmentAnalytics;
};

export function DepartmentStatusCard({ department }: DepartmentStatusCardProps) {
  const scheduledClassCount = department.classes.filter((classRow) => classRow.has_schedule).length;
  const successAverage = department.success_average;

  return (
    <Card size="sm" className="border-[#093657]/10 bg-white shadow-sm">
      <CardHeader className="border-b border-border/80">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="truncate text-base">{department.name}</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">Bölüm güncel görünümü</p>
          </div>
          <Link href={`/bolumler/${department.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Detay
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-3">
        <RichProfileCard
          profile={department.department_manager}
          title="Bölüm Müdürü"
          href={department.department_manager ? `/hocalar/${department.department_manager.id}` : undefined}
          compact
          className="bg-[#f8fafc]"
        />

        <div className="space-y-2 rounded-md border border-border bg-[#f8fafc] p-3">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-[#093657]">Doluluk</span>
            <span className="font-semibold text-[#093657]">{department.active_student_count} / 120</span>
          </div>
          <div className="h-2 rounded-full bg-[#eaf1f6]">
            <div className="h-2 rounded-full bg-[#093657]" style={{ width: `${Math.max(4, department.occupancy_percent)}%` }} />
          </div>
          <div className="text-xs text-muted-foreground">%{department.occupancy_percent}</div>
        </div>

        <div className="space-y-2 rounded-md border border-border bg-[#f8fafc] p-3">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-[#093657]">Başarı Ortalaması</span>
            <span className={cn("font-semibold", successAverage !== null && successAverage >= 85 ? "text-emerald-700" : "text-[#093657]")}>
              {successAverage !== null ? `%${successAverage.toLocaleString("tr-TR")}` : "Veri yok"}
            </span>
          </div>
          <div className="h-2 rounded-full bg-[#eaf1f6]">
            <div
              className={cn("h-2 rounded-full bg-[#093657]", successAverage !== null && successAverage >= 85 ? "bg-emerald-600" : "")}
              style={{ width: `${Math.max(4, successAverage ?? 0)}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <MiniStat icon={GraduationCap} label="Aktif talebe" value={department.active_student_count} />
          <MiniStat icon={LayoutGrid} label="Aktif sınıf" value={department.active_class_count} />
          <MiniStat icon={UsersRound} label="Hoca" value={department.teacher_count} />
          <MiniStat icon={BookOpen} label="Programlı sınıf" value={scheduledClassCount} />
        </div>
      </CardContent>
    </Card>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof GraduationCap;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-md border border-border bg-[#f8fafc] p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="size-3.5 text-[#093657]" aria-hidden="true" />
        <span>{label}</span>
      </div>
      <p className="mt-1 text-lg font-semibold text-[#093657]">{value}</p>
    </div>
  );
}
