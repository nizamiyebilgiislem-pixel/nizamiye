import Link from "next/link";
import { Filter, Plus, FileText } from "lucide-react";

import { AttendanceDashboardCard } from "@/components/attendance/attendance-dashboard-card";
import { AttendanceSessionList } from "@/components/attendance/attendance-session-list";
import { AttendanceSessionCreateForm } from "@/components/attendance/attendance-session-create-form";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth";
import { getAttendanceDashboardSummary, getAttendanceFilterOptions, getAttendanceSessionsForProfile } from "@/lib/attendance/queries";
import { attendanceTypes } from "@/lib/attendance/constants";
import { canManageAttendance } from "@/lib/attendance/permissions";
import { cn } from "@/lib/utils";

type AttendancePageProps = {
  searchParams: Promise<{
    from?: string;
    to?: string;
    attendanceType?: string;
    departmentId?: string;
    classId?: string;
    status?: string;
    search?: string;
    error?: string;
  }>;
};

export default async function AttendancePage({ searchParams }: AttendancePageProps) {
  const query = await searchParams;
  const { profile } = await requireAuth();
  const canManage = canManageAttendance(profile);
  const [summary, data, options] = await Promise.all([
    getAttendanceDashboardSummary(profile),
    getAttendanceSessionsForProfile(profile, {
      from: query.from,
      to: query.to,
      attendanceType: normalizeAttendanceType(query.attendanceType),
      departmentId: query.departmentId,
      classId: query.classId,
      status: normalizeStatus(query.status),
      search: query.search,
    }),
    getAttendanceFilterOptions(profile),
  ]);
  const activeClasses = options.classes.filter((classRow) => classRow.is_active);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <PageHeader
          eyebrow="Yoklama"
          title="Yoklama Sistemi"
          description="Günlük sınıf yoklaması ile sabah, öğle, ikindi, akşam ve yatsı yoklamalarını aynı panelden yönetin."
        />
        <div className="flex flex-wrap gap-2">
          <Link href="/yoklama/raporlar" className={cn(buttonVariants({ variant: "secondary" }))}>
            <FileText className="size-4" aria-hidden="true" />
            Raporlar
          </Link>
          {canManage ? (
            <Link href="/yoklama/yeni" className={cn(buttonVariants())}>
              <Plus className="size-4" aria-hidden="true" />
              Yeni Yoklama
            </Link>
          ) : null}
        </div>
      </div>

      {query.error ? (
        <Card>
          <CardContent className="px-4 py-3 text-sm text-red-900">{query.error}</CardContent>
        </Card>
      ) : null}

      <AttendanceDashboardCard summary={summary} />

      <Card>
        <CardContent className="p-4">
          <form className="grid gap-3 lg:grid-cols-6" action="/yoklama" method="get">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Tarih Başlangıç</label>
              <input type="date" name="from" defaultValue={query.from} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Tarih Bitiş</label>
              <input type="date" name="to" defaultValue={query.to} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Tür</label>
              <select name="attendanceType" defaultValue={query.attendanceType ?? "all"} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm">
                <option value="all">Tümü</option>
                {attendanceTypes.map((type) => (
                  <option key={type} value={type}>
                    {typeLabel(type)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Bölüm</label>
              <select name="departmentId" defaultValue={query.departmentId ?? ""} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm">
                <option value="">Tümü</option>
                {options.departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Sınıf</label>
              <select name="classId" defaultValue={query.classId ?? ""} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm">
                <option value="">Tümü</option>
                {activeClasses.map((classRow) => (
                  <option key={classRow.id} value={classRow.id}>
                    {classRow.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Durum</label>
              <select name="status" defaultValue={query.status ?? "all"} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm">
                <option value="all">Tümü</option>
                <option value="completed">Tamamlandı</option>
                <option value="draft">Taslak</option>
              </select>
            </div>
            <div className="space-y-2 lg:col-span-6">
              <label className="text-xs font-medium text-muted-foreground">Arama</label>
              <div className="flex gap-2">
                <input
                  type="search"
                  name="search"
                  defaultValue={query.search}
                  placeholder="başlık, açıklama, hoca, sınıf"
                  className="h-10 flex-1 rounded-md border border-border bg-background px-3 text-sm"
                />
                <button type="submit" className={cn(buttonVariants({ variant: "secondary" }), "inline-flex items-center gap-2")}>
                  <Filter className="size-4" aria-hidden="true" />
                  Filtrele
                </button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <AttendanceSessionList sessions={data.sessions} canManageAll={canManage} />

      <AttendanceSessionCreateForm classes={activeClasses} />
    </div>
  );
}

function normalizeAttendanceType(value?: string) {
  return value && attendanceTypes.includes(value as (typeof attendanceTypes)[number]) ? (value as (typeof attendanceTypes)[number]) : "all";
}

function normalizeStatus(value?: string) {
  return value === "completed" || value === "draft" ? value : "all";
}

function typeLabel(type: string) {
  const map: Record<string, string> = {
    daily: "Günlük Yoklama",
    fajr: "Sabah Namazı",
    dhuhr: "Öğle Namazı",
    asr: "İkindi Namazı",
    maghrib: "Akşam Namazı",
    isha: "Yatsı Namazı",
  };

  return map[type] ?? type;
}
