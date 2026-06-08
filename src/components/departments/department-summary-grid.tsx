import { Building2, GraduationCap, UsersRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DepartmentSummary } from "@/lib/classes/queries";

type DepartmentSummaryGridProps = {
  departments: DepartmentSummary[];
};

export function DepartmentSummaryGrid({ departments }: DepartmentSummaryGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {departments.map((department) => (
        <Card key={department.id}>
          <CardHeader className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>{department.name}</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">{department.description ?? "Sabit bölüm"}</p>
              </div>
              <Badge variant={department.is_active ? "default" : "secondary"}>{department.is_active ? "Aktif" : "Pasif"}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <Metric icon={Building2} label="Sınıf" value={department.active_class_count} />
              <Metric icon={GraduationCap} label="Talebe" value={department.active_student_count} />
              <Metric icon={UsersRound} label="Hoca" value={department.teacher_count} />
            </div>
            <div className="rounded-md border border-border bg-background p-3">
              <p className="text-xs text-muted-foreground">Bölüm Müdürü</p>
              <p className="mt-1 text-sm font-medium">{department.department_manager?.full_name ?? "-"}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <Icon className="size-4 text-primary" aria-hidden={true} />
      <p className="mt-2 text-lg font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
