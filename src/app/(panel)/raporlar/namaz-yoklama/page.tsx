import Link from "next/link";

import { AttendanceDashboardCard } from "@/components/attendance/attendance-dashboard-card";
import { AttendanceSessionList } from "@/components/attendance/attendance-session-list";
import { PageHeader } from "@/components/layout/page-header";
import { PdfPrintButton } from "@/components/reports/pdf-print-button";
import { Card, CardContent } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth";
import { attendanceTypeLabels, prayerAttendanceTypes } from "@/lib/attendance/constants";
import { getAttendanceDashboardSummary, getAttendanceFilterOptions, getAttendanceReportData } from "@/lib/attendance/queries";
import { logPdfGenerated } from "@/lib/reports/actions";
import { cn } from "@/lib/utils";

type SearchParams = Promise<{
  from?: string;
  to?: string;
  departmentId?: string;
  classId?: string;
  search?: string;
}>;

export default async function PrayerAttendanceReportsPage({ searchParams }: { searchParams: SearchParams }) {
  const [{ profile }, query] = await Promise.all([requireAuth(), searchParams]);
  const [dashboardSummary, filters] = await Promise.all([getAttendanceDashboardSummary(profile), getAttendanceFilterOptions(profile)]);
  const reportData = await getAttendanceReportData(profile, {
    from: query.from,
    to: query.to,
    departmentId: query.departmentId,
    classId: query.classId,
    search: query.search,
  });

  const prayerRows = reportData.rows.filter((row) => prayerAttendanceTypes.includes(row.attendance_type));

  await logPdfGenerated(profile, {
    reportType: "prayer_attendance_report",
    entityType: "report",
    entityId: "prayer-attendance",
    title: "Namaz Yoklaması Raporu PDF",
    description: "Namaz yoklaması raporu oluşturuldu.",
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
        title="Namaz Yoklaması Raporu"
        description="Sabah, öğle, ikindi, akşam ve yatsı namaz yoklamalarını PDF olarak alın."
      />

      <AttendanceDashboardCard summary={dashboardSummary} />

      <Card size="sm">
        <CardContent className="space-y-4 p-4">
          <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Başlangıç" name="from" type="date" defaultValue={query.from} />
            <Field label="Bitiş" name="to" type="date" defaultValue={query.to} />
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
            <div className="xl:col-span-2">
              <Field label="Arama" name="search" type="search" defaultValue={query.search} placeholder="Başlık, sınıf, bölüm, alan" />
            </div>
            <div className="flex items-end gap-2 xl:col-span-2">
              <button type="submit" className="inline-flex h-10 items-center rounded-md bg-[#093657] px-4 text-sm font-medium text-white hover:bg-[#072943]">
                Filtrele
              </button>
              <Link href="/raporlar/namaz-yoklama" className={cn("inline-flex h-10 items-center rounded-md border border-[#093657]/15 bg-white px-4 text-sm font-medium text-[#093657]")}>
                Temizle
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[#093657]">Namaz Yoklaması Oturumları</h2>
              <p className="text-sm text-muted-foreground">
                {prayerRows.length} oturum · {reportData.summary.prayerSessionCount} toplam namaz oturumu
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {prayerAttendanceTypes.map((type) => (
                <span key={type} className="rounded-full border border-[#093657]/15 bg-[#f8fafc] px-3 py-1 text-xs font-medium text-[#093657]">
                  {attendanceTypeLabels[type]}
                </span>
              ))}
            </div>
          </div>
          <AttendanceSessionList sessions={prayerRows} />
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
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
      />
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
      <select name={name} defaultValue={defaultValue} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
