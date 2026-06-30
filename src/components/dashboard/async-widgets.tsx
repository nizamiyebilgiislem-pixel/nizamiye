import { Suspense } from "react";

import { AttendanceDashboardCard } from "@/components/attendance/attendance-dashboard-card";
import { DepartmentOccupancyPanel } from "@/components/dashboard/department-occupancy-panel";
import { DepartmentSuccessPanel } from "@/components/dashboard/department-success-panel";
import { DepartmentStatusCard } from "@/components/dashboard/department-status-card";
import { DormitoryDashboardCard } from "@/components/dormitory/dormitory-dashboard-card";
import { DutyDashboardCard } from "@/components/dashboard/duty-dashboard-card";
import { GuidanceDashboardCard } from "@/components/guidance/guidance-dashboard-card";
import { LibraryDashboardCard } from "@/components/library/library-dashboard-card";
import { LiveSessionDashboardCard } from "@/components/live-sessions/live-session-dashboard-card";
import { TaskDashboardCard } from "@/components/tasks/task-dashboard-card";
import { TodayLessonLogsCard } from "@/components/dashboard/today-lesson-logs-card";
import { EmptyState } from "@/components/ui/empty-state";
import { getAttendanceDashboardSummary } from "@/lib/attendance/queries";
import { getDepartmentAnalyticsForProfile } from "@/lib/departments/analytics";
import { getDormitoryDashboardData, getUnassignedStudentsCount } from "@/lib/dormitory/queries";
import { getGuidanceDashboardData } from "@/lib/guidance/queries";
import { getLibraryDashboardData } from "@/lib/library/queries";
import { getTaskCounts } from "@/lib/tasks/queries";
import { getLiveSessionDashboardData } from "@/lib/live-sessions/queries";
import type { ProfileRow } from "@/types/database";

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-gray-100 ${className}`} />;
}

async function AsyncDepartmentSection({ profile, activeTermName }: { profile: ProfileRow; activeTermName?: string | null }) {
  const departments = await getDepartmentAnalyticsForProfile(profile);
  return (
    <>
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
          <EmptyState title="Görüntülenecek bölüm bulunamadı." />
        )}
      </section>
      <div className="grid gap-4 xl:grid-cols-2">
        <DepartmentOccupancyPanel departments={departments} />
        <DepartmentSuccessPanel departments={departments} activeTermName={activeTermName} />
      </div>
    </>
  );
}

export function SuspenseDepartmentSection({ profile, activeTermName }: { profile: ProfileRow; activeTermName?: string | null }) {
  return (
    <Suspense fallback={
      <div className="space-y-3">
        <Skeleton className="h-5 w-48" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-72" />)}
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          <Skeleton className="h-56" />
          <Skeleton className="h-56" />
        </div>
      </div>
    }>
      <AsyncDepartmentSection profile={profile} activeTermName={activeTermName} />
    </Suspense>
  );
}

async function AsyncAttendanceCard({ profile }: { profile: ProfileRow }) {
  const attendanceSummary = await getAttendanceDashboardSummary(profile);
  return <AttendanceDashboardCard summary={attendanceSummary} />;
}

export function SuspenseAttendanceCard({ profile }: { profile: ProfileRow }) {
  return (
    <Suspense fallback={<Skeleton className="h-56" />}>
      <AsyncAttendanceCard profile={profile} />
    </Suspense>
  );
}

async function AsyncDormitoryCard({ profile }: { profile: ProfileRow }) {
  const [dormitoryData, unassignedCount] = await Promise.all([
    getDormitoryDashboardData(profile),
    getUnassignedStudentsCount(profile),
  ]);
  return (
    <DormitoryDashboardCard
      totalCapacity={dormitoryData.totalCapacity}
      assignedCount={dormitoryData.assignedCount}
      availableCapacity={dormitoryData.availableCapacity}
      totalDormitories={dormitoryData.totalDormitories}
      unassignedStudents={unassignedCount}
    />
  );
}

export function SuspenseDormitoryCard({ profile }: { profile: ProfileRow }) {
  return (
    <Suspense fallback={<Skeleton className="h-40" />}>
      <AsyncDormitoryCard profile={profile} />
    </Suspense>
  );
}

async function AsyncLibraryCard() {
  const libraryData = await getLibraryDashboardData();
  return (
    <LibraryDashboardCard
      totalBooks={libraryData.totalBooks}
      totalCopies={libraryData.totalCopies}
      availableCopies={libraryData.availableCopies}
      borrowedCount={libraryData.borrowedCount}
      overdueCount={libraryData.overdueCount}
      totalDocuments={libraryData.totalDocuments}
    />
  );
}

export function SuspenseLibraryCard() {
  return (
    <Suspense fallback={<Skeleton className="h-40" />}>
      <AsyncLibraryCard />
    </Suspense>
  );
}

async function AsyncGuidanceCard({ profile }: { profile: ProfileRow }) {
  const guidanceData = await getGuidanceDashboardData(profile);
  return (
    <GuidanceDashboardCard
      totalInterviews={guidanceData.total_interviews}
      openFollowUps={guidanceData.open_follow_ups}
      thisMonthInterviews={guidanceData.this_month_interviews}
      activeSurveys={guidanceData.active_surveys}
      plannedActivities={guidanceData.planned_activities}
    />
  );
}

export function SuspenseGuidanceCard({ profile }: { profile: ProfileRow }) {
  return (
    <Suspense fallback={<Skeleton className="h-40" />}>
      <AsyncGuidanceCard profile={profile} />
    </Suspense>
  );
}

async function AsyncTaskCard({ profile }: { profile: ProfileRow }) {
  const taskCounts = await getTaskCounts(profile);
  return (
    <TaskDashboardCard
      openCount={taskCounts.pending + taskCounts.in_progress}
      overdueCount={taskCounts.overdue}
      dueTodayCount={taskCounts.dueToday}
      completedCount={taskCounts.completed}
    />
  );
}

export function SuspenseTaskCard({ profile }: { profile: ProfileRow }) {
  return (
    <Suspense fallback={<Skeleton className="h-40" />}>
      <AsyncTaskCard profile={profile} />
    </Suspense>
  );
}

async function AsyncLiveSessionCard({ profile }: { profile: ProfileRow }) {
  const liveSessionData = await getLiveSessionDashboardData(profile);
  return <LiveSessionDashboardCard upcomingCount={liveSessionData.upcomingCount} />;
}

export function SuspenseLiveSessionCard({ profile }: { profile: ProfileRow }) {
  return (
    <Suspense fallback={<Skeleton className="h-40" />}>
      <AsyncLiveSessionCard profile={profile} />
    </Suspense>
  );
}

export function SuspenseDutyCard() {
  return (
    <Suspense fallback={<Skeleton className="h-40" />}>
      <DutyDashboardCard />
    </Suspense>
  );
}

export function SuspenseTodayLessonLogsCard({ maxItems = 5 }: { maxItems?: number }) {
  return (
    <Suspense fallback={<Skeleton className="h-40" />}>
      <TodayLessonLogsCard maxItems={maxItems} />
    </Suspense>
  );
}
