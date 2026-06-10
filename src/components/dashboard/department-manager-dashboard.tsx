import Link from "next/link";
import {
  AlertTriangle,
  Building2,
  ClipboardList,
  FileText,
  GraduationCap,
  ListChecks,
  School,
  Users,
  UsersRound,
} from "lucide-react";

import { AttendanceDashboardCard } from "@/components/attendance/attendance-dashboard-card";
import { DormitoryDashboardCard } from "@/components/dormitory/dormitory-dashboard-card";
import { GuidanceDashboardCard } from "@/components/guidance/guidance-dashboard-card";
import { LibraryDashboardCard } from "@/components/library/library-dashboard-card";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAttendanceDashboardSummary } from "@/lib/attendance/queries";
import { getDormitoryDashboardData, getUnassignedStudentsCount } from "@/lib/dormitory/queries";
import { getGuidanceDashboardData } from "@/lib/guidance/queries";
import { getLibraryDashboardData } from "@/lib/library/queries";
import { getActiveTerms } from "@/lib/terms/queries";
import type { ProfileRow } from "@/types/database";

import { getDepartmentManagerDashboardData } from "@/lib/dashboard/role-based-queries";

export async function DepartmentManagerDashboard({ profile }: { profile: ProfileRow }) {
  const [data, attendanceSummary, dormitoryData, unassignedCount, libraryData, guidanceData, activeTerms] = await Promise.all([
    getDepartmentManagerDashboardData(profile),
    getAttendanceDashboardSummary(profile),
    getDormitoryDashboardData(profile),
    getUnassignedStudentsCount(profile),
    getLibraryDashboardData(),
    getGuidanceDashboardData(),
    getActiveTerms(),
  ]);

  const activeTerm = activeTerms[0] ?? null;

  if (!data.has_department) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Bölüm Müdürü"
          title="Dashboard"
          description="Bölümünüzün güncel durumunu izleyin."
        />
        <Card className="border-[#093657]/10 bg-white">
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <Building2 className="size-12 text-muted-foreground" aria-hidden />
            <div className="space-y-1 text-center">
              <p className="text-lg font-semibold text-[#093657]">Bölüm bilginiz tanımlı değil</p>
              <p className="text-sm text-muted-foreground">Lütfen yönetici ile iletişime geçin.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const missingAttendanceClasses = data.classes.filter((c) => !c.today_attendance_taken);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={data.department?.name ?? "Bölüm"}
        title="Bölüm Dashboard"
        description="Bölümünüzün güncel durumu, operasyonel eksikler ve sınıf görünümü."
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
        <MiniStatCard icon={GraduationCap} label="Aktif Talebe" value={data.active_student_count} />
        <MiniStatCard icon={School} label="Aktif Sınıf" value={data.active_class_count} />
        <MiniStatCard icon={UsersRound} label="Aktif Hoca" value={data.active_teacher_count} />
        <MiniStatCard icon={ClipboardList} label="Kanaat Eksik" value={data.missing_evaluation_count} />
      </div>

      {missingAttendanceClasses.length > 0 ? (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-start gap-3 p-4">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-amber-900">Yoklama Alınmayan Sınıflar</p>
              <p className="text-sm text-amber-800">
                {missingAttendanceClasses.map((c) => c.name).join(", ")} — Bugün için henüz günlük yoklama alınmamış.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : data.active_class_count > 0 ? (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="flex items-start gap-3 p-4">
            <ListChecks className="mt-0.5 size-5 shrink-0 text-emerald-600" aria-hidden />
            <p className="text-sm font-semibold text-emerald-900">Tüm sınıfların bugünkü yoklaması alınmış.</p>
          </CardContent>
        </Card>
      ) : null}

      <AttendanceDashboardCard summary={attendanceSummary} />

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-[#093657]">Sınıflar</h2>
            <p className="text-xs text-muted-foreground">Bölümünüzdeki aktif sınıfların durumu.</p>
          </div>
          <Link
            href="/siniflar/yeni"
            className="inline-flex items-center gap-1.5 rounded-md bg-[#093657] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#072a4a]"
          >
            Yeni Sınıf
          </Link>
        </div>
        {data.classes.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {data.classes.map((classRow) => (
              <Link key={classRow.id} href={`/siniflar/${classRow.id}`} className="block">
                <Card className="border-[#093657]/10 bg-white transition-colors hover:bg-[#f8fafc]">
                  <CardHeader className="border-b border-border pb-2">
                    <CardTitle className="truncate text-base">{classRow.name}</CardTitle>
                    <CardDescription className="truncate text-xs">
                      {classRow.class_teacher_name ?? "Hoca atanmamış"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between gap-4 p-3 pt-2">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Users className="size-3.5" aria-hidden />
                      <span>{classRow.active_student_count} talebe</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className={classRow.today_attendance_taken ? "text-emerald-600" : "text-amber-600"}>
                        {classRow.today_attendance_taken ? "Yoklama alındı" : "Yoklama alınmadı"}
                      </span>
                      <span className={classRow.has_schedule ? "text-emerald-600" : "text-muted-foreground"}>
                        {classRow.has_schedule ? "Program var" : "Program yok"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="border-[#093657]/10 bg-white">
            <CardContent className="py-8 text-center">
              <School className="mx-auto size-8 text-muted-foreground" aria-hidden />
              <p className="mt-2 text-sm text-muted-foreground">Bölümünüzde henüz aktif sınıf bulunmuyor.</p>
            </CardContent>
          </Card>
        )}
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DormitoryDashboardCard
          totalCapacity={dormitoryData.totalCapacity}
          assignedCount={dormitoryData.assignedCount}
          availableCapacity={dormitoryData.availableCapacity}
          totalDormitories={dormitoryData.totalDormitories}
          unassignedStudents={unassignedCount}
        />
        <LibraryDashboardCard
          totalBooks={libraryData.totalBooks}
          totalCopies={libraryData.totalCopies}
          availableCopies={libraryData.availableCopies}
          borrowedCount={libraryData.borrowedCount}
          overdueCount={libraryData.overdueCount}
          totalDocuments={libraryData.totalDocuments}
        />
        <GuidanceDashboardCard
          totalInterviews={guidanceData.total_interviews}
          openFollowUps={guidanceData.open_follow_ups}
          thisMonthInterviews={guidanceData.this_month_interviews}
          activeSurveys={guidanceData.active_surveys}
          plannedActivities={guidanceData.planned_activities}
        />
        <Card className="bg-white">
          <CardHeader className="border-b border-border pb-2">
            <CardTitle className="text-sm">Açık Talepler</CardTitle>
            <CardDescription className="text-xs">Bekleyen talep ve istekler.</CardDescription>
          </CardHeader>
          <CardContent className="p-3 pt-2">
            <p className="text-2xl font-semibold text-[#093657]">{data.open_talep_count}</p>
            <Link href="/talepler" className="mt-2 inline-block text-xs font-medium text-[#093657] underline underline-offset-2">
              Talepleri Görüntüle
            </Link>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-[#093657]">Hızlı İşlemler</h2>
        <div className="flex flex-wrap gap-2">
          <QuickActionButton href="/talebeler/yeni" label="Yeni Talebe" />
          <QuickActionButton href="/siniflar/yeni" label="Yeni Sınıf" />
          <QuickActionButton href={`/bolumler/${data.department?.id}`} label="Bölüm Dersleri" />
          <QuickActionButton href="/egitim-planlama/ders-programi" label="Ders Programı" />
          <QuickActionButton href="/yoklama" label="Yoklama" />
          <QuickActionButton href="/talepler/yeni" label="Talep Oluştur" />
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
  icon: typeof GraduationCap;
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
