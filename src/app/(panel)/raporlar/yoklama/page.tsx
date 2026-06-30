import Link from "next/link";

import { AttendanceDashboardCard } from "@/components/attendance/attendance-dashboard-card";
import { AttendanceSessionList } from "@/components/attendance/attendance-session-list";
import { PageHeader } from "@/components/layout/page-header";
import { PdfPrintButton } from "@/components/reports/pdf-print-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { requireAuth } from "@/lib/auth";
import { attendanceTypeLabels, attendanceTypes } from "@/lib/attendance/constants";
import { getAttendanceDashboardSummary, getAttendanceFilterOptions, getAttendanceReportData } from "@/lib/attendance/queries";
import { logPdfGenerated } from "@/lib/reports/actions";
import type { AttendanceType } from "@/types/database";
import { cn } from "@/lib/utils";

type SearchParams = Promise<{
  from?: string;
  to?: string;
  attendanceType?: string;
  departmentId?: string;
  classId?: string;
  status?: string;
  search?: string;
}>;

export default async function AttendanceReportsPage({ searchParams }: { searchParams: SearchParams }) {
  const [{ profile }, query] = await Promise.all([requireAuth(), searchParams]);
  const [dashboardSummary, filters] = await Promise.all([getAttendanceDashboardSummary(profile), getAttendanceFilterOptions(profile)]);
  const reportData = await getAttendanceReportData(profile, {
    from: query.from,
    to: query.to,
    attendanceType: normalizeAttendanceType(query.attendanceType),
    departmentId: query.departmentId,
    classId: query.classId,
    status: normalizeStatus(query.status),
    search: query.search,
  });

  await logPdfGenerated(profile, {
    reportType: "attendance_report",
    entityType: "report",
    entityId: "attendance",
    title: "Yoklama Raporu PDF",
    description: "Günlük ve namaz yoklama raporu oluşturuldu.",
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/raporlar" className={cn("text-sm font-medium text-[#093657] hover:underline")}>
          Raporlar&apos;a dön
        </Link>
        <PdfPrintButton />
      </div>

      <PageHeader
        eyebrow="Raporlar"
        title="Yoklama Raporu"
        description="Günlük ve namaz yoklamalarını filtreleyip resmi PDF görünümünde alın."
      />

      <AttendanceDashboardCard summary={dashboardSummary} />

      <Card size="sm">
        <CardContent className="space-y-4 p-4">
          <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <Field label="Başlangıç" name="from" type="date" defaultValue={query.from} />
            <Field label="Bitiş" name="to" type="date" defaultValue={query.to} />
            <SelectField
              label="Tür"
              name="attendanceType"
              defaultValue={query.attendanceType ?? "all"}
              options={[{ value: "all", label: "Tümü" }, ...attendanceTypes.map((type) => ({ value: type, label: attendanceTypeLabels[type] }))]}
            />
            <SelectField
              label="Bölüm"
              name="departmentId"
              defaultValue={query.departmentId ?? ""}
              options={[{ value: "", label: "Tümü" }, ...filters.departments.map((department) => ({ value: department.id, label: department.name }))]}
            />
            <SelectField
              label="Sınıf"
              name="classId"
              defaultValue={query.classId ?? ""}
              options={[{ value: "", label: "Tümü" }, ...filters.classes.map((classRow) => ({ value: classRow.id, label: classRow.name }))]}
            />
            <SelectField
              label="Durum"
              name="status"
              defaultValue={query.status ?? "all"}
              options={[
                { value: "all", label: "Tümü" },
                { value: "completed", label: "Tamamlandı" },
                { value: "draft", label: "Taslak" },
              ]}
            />
            <div className="xl:col-span-2">
              <Field label="Arama" name="search" type="search" defaultValue={query.search} placeholder="Başlık, sınıf, bölüm, alan" />
            </div>
            <div className="flex items-end gap-2 xl:col-span-3">
              <Button type="submit" className="h-10">
                Filtrele
              </Button>
              <Link href="/raporlar/yoklama" className={cn("inline-flex h-10 items-center rounded-md border border-[#093657]/15 bg-white px-4 text-sm font-medium text-[#093657]")}>
                Temizle
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[#093657]">Yoklama Oturumları</h2>
              <p className="text-sm text-muted-foreground">
                {reportData.summary.totalSessions} oturum Â· {reportData.summary.totalRecords} kayıt
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              {reportData.summary.dailySessionCount} günlük Â· {reportData.summary.prayerSessionCount} namaz
            </p>
          </div>
          <AttendanceSessionList sessions={reportData.rows} />
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  name,
  type,
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  type: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <label className="space-y-1 text-sm">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <Input type={type} name={name} defaultValue={defaultValue} placeholder={placeholder} className="h-10" />
    </label>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="space-y-1 text-sm">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <NativeSelect name={name} defaultValue={defaultValue} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </NativeSelect>
    </label>
  );
}

function normalizeAttendanceType(value?: string): AttendanceType | undefined {
  if (!value || value === "all") {
    return undefined;
  }

  return attendanceTypes.includes(value as AttendanceType) ? (value as AttendanceType) : undefined;
}

function normalizeStatus(value?: string) {
  if (!value || value === "all") {
    return undefined;
  }

  return value === "completed" || value === "draft" ? value : undefined;
}
