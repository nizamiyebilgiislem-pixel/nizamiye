import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DepartmentSummary } from "@/lib/departments/queries";

type DepartmentDetailCardProps = {
  department: DepartmentSummary;
};

export function DepartmentDetailCard({ department }: DepartmentDetailCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{department.name}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Info label="Slug" value={department.slug} mono />
        <Info label="Açıklama" value={department.description} />
        <div className="rounded-md border border-border bg-background p-3">
          <p className="text-xs text-muted-foreground">Durum</p>
          <div className="mt-2">
            <Badge variant={department.is_active ? "default" : "secondary"}>{department.is_active ? "Aktif" : "Pasif"}</Badge>
          </div>
        </div>
        <Info label="Sınıf Sayısı" value={String(department.active_class_count)} />
        <Info label="Talebe Sayısı" value={String(department.active_student_count)} />
        <Info label="Bölüm Müdürü" value={department.department_manager?.full_name ?? "-"} />
      </CardContent>
    </Card>
  );
}

function Info({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-sm font-medium ${mono ? "font-mono" : ""}`}>{value || "-"}</p>
    </div>
  );
}
