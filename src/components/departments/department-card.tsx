import Link from "next/link";

import { ClassAccordionCard } from "@/components/classes/class-accordion-card";
import { DepartmentManagerCard } from "@/components/departments/department-manager-card";
import { ProgressMeter } from "@/components/departments/progress-meter";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DepartmentAnalytics } from "@/lib/departments/analytics";
import { cn } from "@/lib/utils";

export function DepartmentCard({ department, canEdit }: { department: DepartmentAnalytics; canEdit: boolean }) {
  return (
    <Card className="bg-white">
      <CardHeader className="border-b border-border">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="truncate">{department.name}</CardTitle>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{department.description ?? "Açıklama girilmedi."}</p>
          </div>
          <Badge variant={department.is_active ? "default" : "outline"}>{department.is_active ? "Aktif" : "Pasif"}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        <DepartmentManagerCard manager={department.department_manager} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Info label="Aktif sınıf" value={department.active_class_count} />
          <Info label="Aktif talebe" value={department.active_student_count} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <ProgressMeter label={`Doluluk (${department.active_student_count}/120)`} value={department.occupancy_percent} />
          <ProgressMeter label="Başarı" value={department.success_average} muted="Henüz not verisi yok" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/bolumler/${department.id}`} className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}>
            Bölüm Detayı
          </Link>
          <Link href={`/siniflar?department=${department.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Sınıfları Gör
          </Link>
          <Link href={`/talebeler?department=${department.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Talebeleri Gör
          </Link>
          {canEdit ? (
            <Link href={`/bolumler/${department.id}/duzenle`} className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
              Düzenle
            </Link>
          ) : null}
        </div>
        {department.classes.length > 0 ? (
          <div className="space-y-3 border-t border-border pt-4">
            <p className="text-sm font-semibold text-[#093657]">Sınıflar</p>
            {department.classes.map((classRow) => (
              <ClassAccordionCard key={classRow.id} classRow={classRow} previewStudentCount={4} showStudentsLink={false} />
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Info({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-[#f8fafc] p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[#093657]">{value}</p>
    </div>
  );
}
