import Link from "next/link";
import type { ComponentType } from "react";
import { Activity, Building2, GraduationCap, School, UsersRound } from "lucide-react";

import { DepartmentOccupancyPanel } from "@/components/dashboard/department-occupancy-panel";
import { DepartmentStatusCard } from "@/components/dashboard/department-status-card";
import { DepartmentSuccessPanel } from "@/components/dashboard/department-success-panel";
import { AttendanceDashboardCard } from "@/components/attendance/attendance-dashboard-card";
import { DormitoryDashboardCard } from "@/components/dormitory/dormitory-dashboard-card";
import { LibraryDashboardCard } from "@/components/library/library-dashboard-card";
import { GuidanceDashboardCard } from "@/components/guidance/guidance-dashboard-card";
import { TaskDashboardCard } from "@/components/tasks/task-dashboard-card";
import { LiveSessionDashboardCard } from "@/components/live-sessions/live-session-dashboard-card";

import { PageHeader } from "@/components/layout/page-header";
import { ReportShortcutCard } from "@/components/reports/report-shortcut-card";
import { StudentAvatar } from "@/components/students/student-avatar";
import { StudentStatusBadge } from "@/components/students/student-status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAttendanceDashboardSummary } from "@/lib/attendance/queries";
import { getDashboardData, type DashboardDistributionItem, type DashboardMetric } from "@/lib/dashboard/queries";
import { getDepartmentAnalyticsForProfile } from "@/lib/departments/analytics";
import { getDormitoryDashboardData, getUnassignedStudentsCount } from "@/lib/dormitory/queries";
import { getGuidanceDashboardData } from "@/lib/guidance/queries";
import { getLibraryDashboardData } from "@/lib/library/queries";
import { getActiveTerms } from "@/lib/terms/queries";
import { getTaskCounts } from "@/lib/tasks/queries";
import { getLiveSessionDashboardData } from "@/lib/live-sessions/queries";

import type { ProfileRow } from "@/types/database";

const metricIcons: Record<string, ComponentType<{ className?: string; "aria-hidden"?: boolean }>> = {
  "active-students": GraduationCap,
  teachers: UsersRound,
  "active-classes": School,
  "active-departments": Building2,
};

export async function AdminDashboard({ profile }: { profile: ProfileRow }) {
  const [dashboard, departments, activeTerms, attendanceSummary, dormitoryData, unassignedCount, libraryData, guidanceData, taskCounts, liveSessionData] = await Promise.all([
    getDashboardData(profile),
    getDepartmentAnalyticsForProfile(profile),
    getActiveTerms(),
    getAttendanceDashboardSummary(profile),
    getDormitoryDashboardData(profile),
    getUnassignedStudentsCount(profile),
    getLibraryDashboardData(),
    getGuidanceDashboardData(profile),
    getTaskCounts(profile),
    getLiveSessionDashboardData(profile),
  ]);
  const activeTerm = activeTerms[0] ?? null;
  const mainMetricKeys = new Set(["active-students", "teachers", "active-classes", "active-departments"]);


  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Yönetim"
        title="Dashboard"
        description="Bölüm durumu, doluluk, başarı ve operasyon kayıtlarını tek ekranda izleyin."
      />

      <Card className="border-[#093657]/10 bg-white">
        <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#eaf1f6]">
              <Activity className="size-5 text-[#093657]" aria-hidden />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Aktif Dönem</p>
              <p className="mt-0.5 text-lg font-semibold text-[#093657]">{activeTerm?.name ?? "Aktif dönem tanımlı değil"}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {activeTerm ? "Not ve başarı panelleri bu dönem verilerine göre hesaplanır." : "Not ve başarı panelleri için aktif dönem tanımlanmalıdır."}
          </p>
        </CardContent>
      </Card>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-[#093657]">Bölümlerin Güncel Durumu</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {dashboard.metrics.filter((metric) => mainMetricKeys.has(metric.key)).map((metric) => (
            <SmallMetricCard key={metric.key} metric={metric} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="space-y-0.5">
          <h2 className="text-sm font-semibold text-[#093657]">Bölüm Bazlı Detay</h2>
          <p className="text-xs text-muted-foreground">Müdür, doluluk, başarı ve program durumu.</p>
        </div>
        {departments.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {departments.map((department) => (
              <DepartmentStatusCard key={department.id} department={department} />
            ))}
          </div>
        ) : (
          <EmptyState text="Görüntülenecek bölüm bulunamadı." />
        )}
      </section>

      <AttendanceDashboardCard summary={attendanceSummary} />

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
        <TaskDashboardCard
          openCount={taskCounts.pending + taskCounts.in_progress}
          overdueCount={taskCounts.overdue}
          dueTodayCount={taskCounts.dueToday}
          completedCount={taskCounts.completed}
        />
        <LiveSessionDashboardCard upcomingCount={liveSessionData.upcomingCount} />
        <div className="space-y-3">
          <ReportShortcutCard
            title="PDF Merkezi"
            description="Talebe, sınıf, bölüm ve dönem raporlarına hızlı erişim."
            href="/raporlar"
            badge={
              <span className="inline-flex items-center rounded-md bg-[#eaf1f6] px-2 py-0.5 text-xs font-medium text-[#093657]">
                Hızlı erişim
              </span>
            }
          />
          <ReportShortcutCard
            title="Raporlar Merkezi"
            description="Genel rapor merkezi ve resmi çıktılar."
            href="/raporlar"
            badge={
              <span className="inline-flex items-center rounded-md bg-[#eaf1f6] px-2 py-0.5 text-xs font-medium text-[#093657]">
                Merkez
              </span>
            }
          />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <DepartmentOccupancyPanel departments={departments} />
        <DepartmentSuccessPanel departments={departments} activeTermName={activeTerm?.name} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="bg-white xl:col-span-2">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-base">Son Eklenen Talebeler</CardTitle>
            <CardDescription>Yetki alanınızdaki en yeni talebe kayıtları.</CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-border p-0">
            {dashboard.latestStudents.length > 0 ? (
              dashboard.latestStudents.map((student) => (
                <Link key={student.id} href={`/talebeler/${student.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-[#f8fafc]">
                  <StudentAvatar name={student.full_name} photoUrl={student.photo_url} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#0f172a]">{student.full_name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {student.department?.name ?? "Bölüm yok"} · {student.course_class?.name ?? "Sınıf yok"}
                    </p>
                  </div>
                  <StudentStatusBadge status={student.status} />
                </Link>
              ))
            ) : (
              <EmptyState text="Henüz kayıt yok." />
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <DistributionCard title="Bölümlere Göre Dağılım" items={dashboard.departmentDistribution} />
          <DistributionCard title="Sınıflara Göre Dağılım" items={dashboard.classDistribution} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <RecentStudentRecordsCard
          title="Son Revir Kayıtları"
          description="Sağlık birimindeki son işlemler."
          items={dashboard.latestInfirmaryRecords.map((record) => ({
            id: record.id,
            href: `/revir/${record.id}`,
            name: record.student?.full_name ?? "Talebe yok",
            photoUrl: record.student?.photo_url ?? null,
            meta: `${record.record_date} · ${record.complaint ?? "Şikayet girilmedi"}`,
          }))}
        />
        <RecentStudentRecordsCard
          title="Son Evraklar"
          description="Yüklenen en yeni talebe evrakları."
          items={dashboard.latestDocuments.map((document) => ({
            id: document.id,
            href: `/evraklar/${document.id}`,
            name: document.student?.full_name ?? "Talebe yok",
            photoUrl: document.student?.photo_url ?? null,
            meta: `${document.document_type} · ${formatDate(document.created_at)}`,
          }))}
        />
        <RecentStudentRecordsCard
          title="Son Kanaatler"
          description="Girilen en yeni kanaat kayıtları."
          items={dashboard.latestEvaluations.map((evaluation) => ({
            id: evaluation.id,
            href: `/kanaat-sistemi/kanaat-girisi/${evaluation.student_id}`,
            name: evaluation.student?.full_name ?? "Talebe yok",
            photoUrl: evaluation.student?.photo_url ?? null,
            meta: evaluation.general_opinion ?? formatDate(evaluation.created_at),
          }))}
        />
      </div>
    </div>
  );
}

function SmallMetricCard({ metric }: { metric: DashboardMetric }) {
  const Icon = metricIcons[metric.key] ?? Activity;

  return (
    <Card className="border-[#e5e7eb] bg-white">
      <CardContent className="flex items-center gap-2.5 p-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-[#eaf1f6]">
          <Icon className="size-4 text-[#093657]" aria-hidden />
        </div>
        <div className="flex flex-1 items-center justify-between gap-2">
          <p className="truncate text-xs font-medium text-muted-foreground">{metric.label}</p>
          <p className="text-sm font-semibold text-[#093657]">{metric.value.toLocaleString("tr-TR")}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function RecentStudentRecordsCard({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: Array<{ id: string; href: string; name: string; photoUrl: string | null; meta: string }>;
}) {
  return (
    <Card className="bg-white">
      <CardHeader className="border-b border-border pb-3">
        <CardTitle className="text-sm">{title}</CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent className="divide-y divide-border p-0">
        {items.length > 0 ? (
          items.map((item) => (
            <Link key={item.id} href={item.href} className="flex min-h-[52px] items-center gap-3 px-4 py-3 hover:bg-[#f8fafc]">
              <StudentAvatar name={item.name} photoUrl={item.photoUrl} />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[#0f172a]">{item.name}</p>
                <p className="line-clamp-1 text-xs text-muted-foreground">{item.meta}</p>
              </div>
            </Link>
          ))
        ) : (
          <EmptyState text="Henüz kayıt yok." />
        )}
      </CardContent>
    </Card>
  );
}

function DistributionCard({ title, items }: { title: string; items: DashboardDistributionItem[] }) {
  const maxCount = Math.max(...items.map((item) => item.count), 1);

  return (
    <Card className="bg-white">
      <CardHeader className="border-b border-border pb-3">
        <CardTitle className="text-sm">{title}</CardTitle>
        <CardDescription className="text-xs">Aktif talebe kayıtlarına göre.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2.5 p-4">
        {items.length > 0 ? (
          items.map((item) => (
            <Link
              key={item.id}
              href={title === "Sınıflara Göre Dağılım" ? `/siniflar/${item.id}` : `/bolumler/${item.id}`}
              className="block space-y-1.5 rounded-lg border border-[#e5e7eb] bg-[#f8fafc] p-2.5 transition-colors hover:bg-[#eaf1f6]"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-xs font-medium text-[#0f172a]">{item.name}</p>
                <span className="text-sm font-semibold text-[#093657]">{item.count}</span>
              </div>
              <div className="h-1.5 rounded-full bg-[#eaf1f6]">
                <div className="h-1.5 rounded-full bg-[#093657]" style={{ width: `${Math.max(4, (item.count / maxCount) * 100)}%` }} />
              </div>
            </Link>
          ))
        ) : (
          <EmptyState text="Veri yok." />
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="px-4 py-6 text-center text-sm text-muted-foreground">{text}</div>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(new Date(value));
}
