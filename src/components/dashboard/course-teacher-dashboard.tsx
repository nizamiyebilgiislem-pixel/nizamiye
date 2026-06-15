import Link from "next/link";
import { BookOpen, FileText, GraduationCap, ListChecks, School } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { getActiveTerms } from "@/lib/terms/queries";
import { getTaskCounts } from "@/lib/tasks/queries";
import type { ProfileRow } from "@/types/database";

import { getCourseTeacherDashboardData } from "@/lib/dashboard/role-based-queries";

export async function CourseTeacherDashboard({ profile }: { profile: ProfileRow }) {
  const [data, activeTerms, taskCounts] = await Promise.all([
    getCourseTeacherDashboardData(profile),
    getActiveTerms(),
    getTaskCounts(profile),
  ]);

  const activeTerm = activeTerms[0] ?? null;

  if (data.courses.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Ders Hocası"
title="Yönetim Paneli"
          description="Derslerinizin güncel durumunu izleyin."
        />
        <Card className="border-[#093657]/10 bg-white">
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <BookOpen className="size-12 text-muted-foreground" aria-hidden />
            <div className="space-y-1 text-center">
              <p className="text-lg font-semibold text-[#093657]">Size atanmış aktif ders bulunmuyor</p>
              <p className="text-sm text-muted-foreground">Henüz bir derse atanmadınız veya dersleriniz pasif durumda.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const assignedClassIds = [...new Set(data.courses.map((c) => c.class_id))];
  const todaySlotCount = data.today_schedule.length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Ders Hocası"
        title="Dashboard"
        description="Atandığınız dersleri, programınızı ve not işlemlerinizi yönetin."
      />

      {activeTerm ? (
        <Card className="border-[#093657]/10 bg-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#eaf1f6]">
                <GraduationCap className="size-5 text-[#093657]" aria-hidden />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Aktif Dönem</p>
                <p className="text-lg font-semibold text-[#093657]">{activeTerm.name}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStatCard icon={BookOpen} label="Aktif Ders" value={data.courses.length} />
        <MiniStatCard icon={School} label="Atandığım Sınıf" value={assignedClassIds.length} />
        <MiniStatCard icon={ListChecks} label="Bugünkü Ders" value={todaySlotCount} />
        <Card className="bg-white">
          <CardContent className="flex items-center gap-2.5 p-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-[#eaf1f6]">
              <ListChecks className="size-4 text-[#093657]" aria-hidden />
            </div>
            <div className="flex flex-1 items-center justify-between gap-2">
              <p className="truncate text-xs font-medium text-muted-foreground">Bana Atanan Görev</p>
              <Link href="/gorevler?tab=my" className="text-sm font-semibold text-[#093657] underline underline-offset-2">{taskCounts.myTasks}</Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-[#093657]">Atandığım Dersler</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {data.courses.map((course) => (
            <Card key={course.id} className="border-[#093657]/10 bg-white">
              <CardHeader className="border-b border-border pb-2">
                <CardTitle className="truncate text-base">{course.course_name}</CardTitle>
                <CardDescription className="truncate text-xs">
                  {course.class_name}{course.department_name ? ` · ${course.department_name}` : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex gap-2 p-3 pt-2">
                <Link
                  href={`/not-sistemi/dersler/${course.course_id}`}
                  className="inline-flex items-center gap-1 rounded-md bg-[#eaf1f6] px-2.5 py-1 text-xs font-medium text-[#093657] transition-colors hover:bg-[#d4e2ed]"
                >
                  Not Gir
                </Link>
                <Link
                  href={`/yoklama/yeni?classId=${course.class_id}`}
                  className="inline-flex items-center gap-1 rounded-md bg-[#eaf1f6] px-2.5 py-1 text-xs font-medium text-[#093657] transition-colors hover:bg-[#d4e2ed]"
                >
                  Yoklama Al
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-[#093657]">Hızlı İşlemler</h2>
        <div className="flex flex-wrap gap-2">
          <QuickActionButton href="/not-sistemi" label="Not Sistemi" />
          <QuickActionButton href="/yoklama/yeni" label="Ders Yoklaması Al" />
          <QuickActionButton href="/egitim-planlama/ders-programi" label="Ders Programım" />
        </div>
      </section>
    </div>
  );
}

function MiniStatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BookOpen;
  label: string;
  value: number;
}) {
  return (
    <Card className="border-[#e5e7eb] bg-white">
      <CardContent className="flex items-center gap-2.5 p-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-[#eaf1f6]">
          <Icon className="size-4 text-[#093657]" aria-hidden />
        </div>
        <div className="flex flex-1 items-center justify-between gap-2">
          <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
          <p className="text-sm font-semibold text-[#093657]">{value.toLocaleString("tr-TR")}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickActionButton({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-md border border-[#093657]/20 bg-white px-3 py-2 text-xs font-medium text-[#093657] transition-colors hover:bg-[#eaf1f6]"
    >
      <FileText className="size-3.5" aria-hidden />
      {label}
    </Link>
  );
}
