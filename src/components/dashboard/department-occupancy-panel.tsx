import { ProgressMeter } from "@/components/departments/progress-meter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DepartmentAnalytics } from "@/lib/departments/analytics";

export function DepartmentOccupancyPanel({ departments }: { departments: DepartmentAnalytics[] }) {
  return (
    <Card size="sm" className="bg-white">
      <CardHeader className="border-b border-border">
        <CardTitle>Bölüm Doluluk Grafiği</CardTitle>
        <CardDescription>Her bölüm için 120 kişilik kapasiteye göre aktif talebe oranı.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 p-4">
        {departments.length > 0 ? (
          departments.map((department) => (
            <ProgressMeter key={department.id} label={`${department.name}: ${department.active_student_count} / 120`} value={department.occupancy_percent} />
          ))
        ) : (
          <p className="text-sm text-muted-foreground">Doluluk verisi bulunamadı.</p>
        )}
      </CardContent>
    </Card>
  );
}
