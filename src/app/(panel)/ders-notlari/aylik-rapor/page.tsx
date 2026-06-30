import { redirect } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireAuth } from "@/lib/auth";
import { canViewMonthlyReport } from "@/lib/daily-lesson-logs/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PageProps = {
  searchParams: Promise<{ month?: string }>;
};

export default async function MonthlyReportPage({ searchParams }: PageProps) {
  const query = await searchParams;
  const { profile } = await requireAuth();

  if (!canViewMonthlyReport(profile)) {
    redirect("/dashboard");
  }

  const today = new Date();
  const monthParam = query.month;

  let year: number;
  let month: number;

  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    [year, month] = monthParam.split("-").map(Number);
  } else {
    year = today.getFullYear();
    month = today.getMonth() + 1;
  }

  const monthStr = `${year}-${String(month).padStart(2, "0")}`;
  const startDate = `${monthStr}-01`;
  const endDate = new Date(year, month, 0).toISOString().split("T")[0];

  const supabase = await createSupabaseServerClient();

  const { data: logs } = await supabase
    .from("daily_lesson_logs")
    .select(`
      id,
      teacher_id,
      lesson_date,
      class_course:class_courses(
        class:classes(department_id)
      )
    `)
    .gte("lesson_date", startDate)
    .lte("lesson_date", endDate);

  const { data: departments } = await supabase
    .from("departments")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  const { data: allTeachers } = await supabase
    .from("profiles")
    .select("id, department_id, full_name")
    .eq("role", "hoca")
    .eq("is_active", true);

  const logsByDept = new Map<string, number>();
  const teachersByDept = new Map<string, string[]>();

  (logs ?? []).forEach((log) => {
    const deptId = (log as { class_course?: { class?: { department_id?: string } } }).class_course?.class?.department_id;
    if (deptId) {
      logsByDept.set(deptId, (logsByDept.get(deptId) ?? 0) + 1);
    }
  });

  (allTeachers ?? []).forEach((teacher) => {
    if ((teacher as { department_id?: string }).department_id) {
      const deptId = (teacher as { department_id: string }).department_id;
      const existing = teachersByDept.get(deptId) ?? [];
      existing.push((teacher as { id: string }).id);
      teachersByDept.set(deptId, existing);
    }
  });

  const departmentStats = (departments ?? []).map((dept) => {
    const teacherCount = teachersByDept.get(dept.id)?.length ?? 0;
    const logCount = logsByDept.get(dept.id) ?? 0;
    const avgLogsPerTeacher = teacherCount > 0 ? (logCount / teacherCount).toFixed(1) : "0";

    return {
      id: dept.id,
      name: dept.name,
      teacherCount,
      logCount,
      avgLogsPerTeacher: Number(avgLogsPerTeacher),
    };
  });

  const totalLogs = departmentStats.reduce((sum, d) => sum + d.logCount, 0);
  const totalTeachers = departmentStats.reduce((sum, d) => sum + d.teacherCount, 0);
  const overallAvg = totalTeachers > 0 ? (totalLogs / totalTeachers).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Raporlar"
        title="Aylık Ders Notu Raporu"
        description="Tüm bölümlerin aylık ders notu istatistiklerini görüntüleyin."
      />

      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle>Ay Seçimi</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <form className="flex gap-4">
            <Input
              type="month"
              name="month"
              defaultValue={monthStr}
              className="h-10"
            />
            <Button type="submit">
              Göster
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-medium text-muted-foreground">Toplam Not</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-[#093657]">{totalLogs}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-medium text-muted-foreground">Toplam Öğretmen</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-[#093657]">{totalTeachers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-medium text-muted-foreground">Ortalama Not/Öğretmen</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-[#093657]">{overallAvg}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bölüm Bazlı İstatistikler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {departmentStats.map((dept) => (
              <div key={dept.id} className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">{dept.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {dept.teacherCount} öğretmen
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-2xl font-semibold">{dept.logCount}</p>
                    <p className="text-xs text-muted-foreground">ders notu</p>
                  </div>
                  <Badge variant="outline">
                    ort: {dept.avgLogsPerTeacher}
                  </Badge>
                </div>
              </div>
            ))}

            {departmentStats.length === 0 && (
              <p className="text-center text-muted-foreground">Veri bulunamadı.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}