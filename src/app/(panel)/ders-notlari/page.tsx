import { redirect } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireAuth } from "@/lib/auth";
import { canViewDailyLessonLog } from "@/lib/daily-lesson-logs/permissions";
import {
  getClassCoursesForTeacher,
  getMyDailyLessonLogs,
  type DailyLessonLogWithRelations,
} from "@/lib/daily-lesson-logs/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCourseBooksForTeacher } from "@/lib/course-books/queries";
import { DailyLessonLogForm } from "@/components/daily-lesson-logs/daily-lesson-log-form";
import { DailyLessonLogList } from "@/components/daily-lesson-logs/daily-lesson-log-list";
import type { ProfileRow } from "@/types/database";

type PageProps = {
  searchParams: Promise<{ success?: string }>;
};

export default async function DailyLessonLogsPage({ searchParams }: PageProps) {
  const query = await searchParams;
  const { profile } = await requireAuth();

  if (!canViewDailyLessonLog(profile)) {
    redirect("/dashboard");
  }

  const [myLogs, classCourses] = await Promise.all([
    getMyDailyLessonLogs(profile.id, 20),
    ["hoca", "bolum_muduru"].includes(profile.role) ? getClassCoursesForTeacher(profile.id) : [],
  ]);

  const courseBooks = await getCourseBooksForTeacher(profile.id);

  const classCourseOptions = classCourses.map((cc) => ({
    id: (cc as { id: string }).id,
    class: (cc as { class: { id: string; name: string } }).class,
    course: (cc as { course: { id: string; name: string } }).course,
  }));

  const courseBookOptions = courseBooks.map((cb) => ({
    id: (cb as { id: string }).id,
    title: (cb as { title: string }).title,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Eğitim"
        title="Ders Notları"
        description="Günlük ders notlarınızı kaydedin ve görüntüleyin."
      />

      {query.success === "created" && (
        <div className="rounded-lg bg-green-50 p-4 text-green-800">
          Ders notu başarıyla eklendi.
        </div>
      )}
      {query.success === "updated" && (
        <div className="rounded-lg bg-green-50 p-4 text-green-800">
          Ders notu başarıyla güncellendi.
        </div>
      )}
      {query.success === "deleted" && (
        <div className="rounded-lg bg-green-50 p-4 text-green-800">
          Ders notu başarıyla silindi.
        </div>
      )}

      {["hoca", "bolum_muduru"].includes(profile.role) && (
        <Card>
          <CardHeader>
            <CardTitle>Yeni Ders Notu Ekle</CardTitle>
          </CardHeader>
          <CardContent>
            {classCourses.length > 0 ? (
              <DailyLessonLogForm
                classCourses={classCourseOptions}
                courseBooks={courseBookOptions}
              />
            ) : (
              <p className="text-muted-foreground">
                Henüz size atanmış bir ders bulunmuyor. Ders atamalarınız tamamlandığında not girebilirsiniz.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="recent">
        <TabsList>
          <TabsTrigger value="recent">Son Notlarım</TabsTrigger>
          {["admin", "genel_mudur", "bolum_muduru"].includes(profile.role) && (
            <TabsTrigger value="all">Tüm Notlar</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="recent" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Son Ders Notlarım</CardTitle>
            </CardHeader>
            <CardContent>
              <DailyLessonLogList
                logs={[]}
                showActions={false}
              />
              {myLogs.length === 0 ? (
                <p className="text-muted-foreground">Henüz ders notu girmemişsiniz.</p>
              ) : (
                <p className="text-muted-foreground">{myLogs.length} adet ders notu mevcut.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {["admin", "genel_mudur", "bolum_muduru"].includes(profile.role) && (
          <TabsContent value="all" className="mt-4">
            <AllLogsSection profile={profile} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

async function AllLogsSection({ profile }: { profile: Pick<ProfileRow, "id" | "role" | "department_id"> }) {
  const supabase = await createSupabaseServerClient();

  const { data: logs } = await supabase
    .from("daily_lesson_logs")
    .select(`
      *,
      class_course:class_courses(
        id,
        class:classes(id, name, department_id),
        course:courses(id, name)
      ),
      teacher:profiles(id, full_name),
      course_book:course_books(id, title)
    `)
    .order("lesson_date", { ascending: false })
    .limit(50);

  const validLogs = (logs ?? []).filter((log) => {
    const typedLog = log as { class_course?: { class?: { department_id?: string } } };
    if (profile.role === "bolum_muduru") {
      return typedLog.class_course?.class?.department_id === profile.department_id;
    }
    return true;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tüm Ders Notları</CardTitle>
      </CardHeader>
      <CardContent>
        {validLogs.length === 0 ? (
          <p className="text-muted-foreground">Henüz ders notu bulunmuyor.</p>
        ) : (
          <DailyLessonLogList
            logs={validLogs as DailyLessonLogWithRelations[]}
            canEdit={(log) => log.teacher_id === profile.id}
          />
        )}
      </CardContent>
    </Card>
  );
}
