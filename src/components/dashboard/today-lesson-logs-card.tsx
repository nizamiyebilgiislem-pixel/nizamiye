import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getLinkedStudentIdsForParent } from "@/lib/student-profile/queries";
import { cn } from "@/lib/utils";

type DailyLogItem = {
  id: string;
  lesson_date: string;
  topics_covered: string;
  class_name: string;
  course_name: string;
  teacher_name: string;
};

type Props = {
  className?: string;
  maxItems?: number;
  showTeacher?: boolean;
};

export async function TodayLessonLogsCard({ className, maxItems = 5, showTeacher = false }: Props) {
  const { profile } = await requireAuth();
  const supabase = await createSupabaseServerClient();

  const today = new Date().toISOString().split("T")[0];

  let query = supabase
    .from("daily_lesson_logs")
    .select(`
      id,
      lesson_date,
      topics_covered,
      class_course:class_courses(
        class:classes(id, name),
        course:courses(id, name)
      ),
      teacher:profiles!daily_lesson_logs_teacher_id_fkey(id, full_name)
    `)
    .eq("lesson_date", today);

  if (profile.role === "bolum_muduru" && profile.department_id) {
    query = query.eq("class_course.class.department_id", profile.department_id);
  }

  if (profile.role === "hoca") {
    query = query.eq("teacher_id", profile.id);
  }

  if (profile.role === "veli" || profile.role === "sponsor") {
    const linkedStudentIds = await getLinkedStudentIdsForParent(profile.id);
    if (linkedStudentIds.length > 0) {
      const { data: linkedStudents } = await supabase
        .from("students")
        .select("course_class_id")
        .in("id", linkedStudentIds)
        .not("course_class_id", "is", null);

      const classIds = [...new Set((linkedStudents ?? []).map((s) => (s as { course_class_id: string }).course_class_id).filter(Boolean))];
      if (classIds.length > 0) {
        query = query.in("class_course.class_id", classIds);
      } else {
        return (
          <Card className={cn("bg-white", className)}>
            <CardHeader className="border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="size-4 text-[#093657]" aria-hidden />
                <CardTitle className="text-sm">Bugün İşlenen Konular</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                Bağlı öğrencilerin sınıfı henüz belirlenmemiş.
              </div>
            </CardContent>
          </Card>
        );
      }
    } else {
      return (
        <Card className={cn("bg-white", className)}>
          <CardHeader className="border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="size-4 text-[#093657]" aria-hidden />
              <CardTitle className="text-sm">Bugün İşlenen Konular</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              Henüz bağlı öğrenci bulunmuyor.
            </div>
          </CardContent>
        </Card>
      );
    }
  }

  const { data: logs } = await query;

  const items: DailyLogItem[] = (logs ?? []).map((log) => {
    const typedLog = log as {
      id: string;
      lesson_date: string;
      topics_covered: string;
      class_course?: {
        class?: { name?: string };
        course?: { name?: string };
      };
      teacher?: { full_name?: string };
    };
    return {
      id: typedLog.id,
      lesson_date: typedLog.lesson_date,
      topics_covered: typedLog.topics_covered,
      class_name: typedLog.class_course?.class?.name ?? "-",
      course_name: typedLog.class_course?.course?.name ?? "-",
      teacher_name: typedLog.teacher?.full_name ?? "-",
    };
  }).slice(0, maxItems);

  const totalCount = (logs ?? []).length;

  return (
    <Card className={cn("bg-white", className)}>
      <CardHeader className="border-b border-border pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="size-4 text-[#093657]" aria-hidden />
            <CardTitle className="text-sm">Bugün İşlenen Konular</CardTitle>
          </div>
          {totalCount > maxItems && (
            <Link
              href="/ders-notlari"
              className="text-xs font-medium text-[#093657] hover:underline"
            >
              Tümünü gör ({totalCount})
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent className="divide-y divide-border p-0">
        {items.length > 0 ? (
          items.map((item) => (
            <div key={item.id} className="px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-[#093657]">
                    {item.class_name} - {item.course_name}
                  </p>
                  {showTeacher && (
                    <p className="text-xs text-muted-foreground">{item.teacher_name}</p>
                  )}
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {item.topics_covered}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
            Bugün için ders notu girilmemiş.
          </div>
        )}
      </CardContent>
    </Card>
  );
}