import { redirect } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireAuth } from "@/lib/auth";
import { canViewWeeklyReport } from "@/lib/daily-lesson-logs/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { WeeklySummaryReport } from "@/components/daily-lesson-logs/weekly-summary-report";

type PageProps = {
  searchParams: Promise<{ week?: string }>;
};

export default async function WeeklyReportPage({ searchParams }: PageProps) {
  const query = await searchParams;
  const { profile } = await requireAuth();

  if (!canViewWeeklyReport(profile)) {
    redirect("/dashboard");
  }

  const today = new Date();
  const weekParam = query.week;

  let weekStart: Date;
  let weekEnd: Date;

  if (weekParam) {
    const [year, week] = weekParam.split("-").map(Number);
    weekStart = getWeekStart(year, week);
    weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
  } else {
    weekStart = getWeekStart(today.getFullYear(), getWeekNumber(today));
    weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
  }

  const startStr = weekStart.toISOString().split("T")[0];
  const endStr = weekEnd.toISOString().split("T")[0];

  const supabase = await createSupabaseServerClient();

  let teacherQuery = supabase
    .from("daily_lesson_logs")
    .select(`
      id,
      teacher_id,
      lesson_date,
      topics_covered,
      class_course:class_courses(
        id,
        class:classes(id, name, department_id),
        course:courses(id, name)
      ),
      teacher:profiles!daily_lesson_logs_teacher_id_fkey(id, full_name)
    `)
    .gte("lesson_date", startStr)
    .lte("lesson_date", endStr);

  if (profile.role === "bolum_muduru" && profile.department_id) {
    teacherQuery = teacherQuery.eq("class_course.class.department_id", profile.department_id);
  }

  const { data: logs } = await teacherQuery;

  type TeacherSummaryEntry = {
    teacher_id: string;
    teacher_name: string;
    total_logs: number;
    dates: string[];
    logs: Array<{
      id: string;
      lesson_date: string;
      class_name: string;
      course_name: string;
      topics: string;
    }>;
  };

  const teacherMap = new Map<string, TeacherSummaryEntry>();
  const teacherLogs = logs ?? [];

  teacherLogs.forEach((log) => {
    const typedLog = log as {
      teacher_id: string;
      teacher?: { full_name?: string };
      id: string;
      lesson_date: string;
      class_course?: {
        class?: { name?: string };
        course?: { name?: string };
      };
      topics_covered: string;
    };
    const tid = typedLog.teacher_id;
    if (!teacherMap.has(tid)) {
      teacherMap.set(tid, {
        teacher_id: tid,
        teacher_name: typedLog.teacher?.full_name ?? "Bilinmeyen",
        total_logs: 0,
        dates: [],
        logs: [],
      });
    }
    const entry = teacherMap.get(tid)!;
    entry.total_logs++;
    if (!entry.dates.includes(typedLog.lesson_date)) {
      entry.dates.push(typedLog.lesson_date);
    }
    entry.logs.push({
      id: typedLog.id,
      lesson_date: typedLog.lesson_date,
      class_name: typedLog.class_course?.class?.name ?? "-",
      course_name: typedLog.class_course?.course?.name ?? "-",
      topics: typedLog.topics_covered,
    });
  });

  const teacherSummaries = Array.from(teacherMap.values());

  type MissingTeacherEntry = { id: string; full_name: string };
  let allTeachersInDepartment: MissingTeacherEntry[] = [];
  if (profile.role === "bolum_muduru" && profile.department_id) {
    const { data: deptTeachers } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("department_id", profile.department_id)
      .eq("role", "hoca")
      .eq("is_active", true);

    allTeachersInDepartment = deptTeachers ?? [];
  }

  const teachersWithLogs = new Set(teacherSummaries.map((t) => t.teacher_id));
  const missingTeachers = allTeachersInDepartment.filter(
    (t) => !teachersWithLogs.has(t.id)
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Raporlar"
        title="Haftalık Ders Notu Özeti"
        description={`Bölümünüzdeki öğretmenlerin haftalık ders notu özetini görüntüleyin.`}
      />

      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle>Hafta Seçimi</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <form className="flex gap-4">
            <Input
              type="week"
              name="week"
              defaultValue={`${weekStart.getFullYear()}-W${String(getWeekNumber(weekStart)).padStart(2, "0")}`}
              className="h-10"
            />
            <Button type="submit">
              Göster
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <WeeklySummaryReport
            teacherSummaries={teacherSummaries}
            missingTeachers={missingTeachers}
            weekStart={startStr}
            weekEnd={endStr}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function getWeekStart(year: number, week: number): Date {
  const jan1 = new Date(year, 0, 1);
  const daysToMonday = jan1.getDay() === 0 ? -6 : 1 - jan1.getDay();
  const firstMonday = new Date(jan1);
  firstMonday.setDate(jan1.getDate() + daysToMonday);
  const weekStart = new Date(firstMonday);
  weekStart.setDate(weekStart.getDate() + (week - 1) * 7);
  return weekStart;
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}