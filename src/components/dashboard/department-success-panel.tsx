import { ProgressMeter } from "@/components/departments/progress-meter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DepartmentAnalytics } from "@/lib/departments/analytics";

export function DepartmentSuccessPanel({ departments, activeTermName }: { departments: DepartmentAnalytics[]; activeTermName?: string | null }) {
  return (
    <Card size="sm" className="bg-white">
      <CardHeader className="border-b border-border">
        <CardTitle>Bölüm Başarı Grafiği</CardTitle>
        <CardDescription>
          {activeTermName ? `${activeTermName} dönemindeki not ve kanaat kayıtlarına göre hesaplanır.` : "Aktif talebelerin mevcut not ortalamalarına göre hesaplanır."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 p-4">
        {departments.length > 0 ? (
          departments.map((department) => <ProgressMeter key={department.id} label={department.name} value={department.success_average} muted="Veri yok" />)
        ) : (
          <p className="text-sm text-muted-foreground">Başarı verisi bulunamadı.</p>
        )}
      </CardContent>
    </Card>
  );
}
