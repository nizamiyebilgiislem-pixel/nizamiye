import Link from "next/link";

import { AttendanceDashboardCard } from "@/components/attendance/attendance-dashboard-card";
import { AttendanceSessionList } from "@/components/attendance/attendance-session-list";
import { PageHeader } from "@/components/layout/page-header";
import { PdfPrintButton } from "@/components/reports/pdf-print-button";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
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
    title: "Namaz YoklamasÄ± Raporu PDF",
    description: "Namaz yoklamasÄ± raporu oluÅŸturuldu.",
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/raporlar" className={cn("text-sm font-medium text-[#093657] hover:underline")}>
          Raporlar&apos;a dÃ¶n
        </Link>
        <PdfPrintButton />
      </div>

      <PageHeader
        eyebrow="Raporlar"
        title="Namaz YoklamasÄ± Raporu"
        description="Sabah, Ã¶ÄŸle, ikindi, akÅŸam ve yatsÄ± namaz yoklamalarÄ±nÄ± PDF olarak alÄ±n."
      />

      <AttendanceDashboardCard summary={dashboardSummary} />

      <Card size="sm">
        <CardContent className="space-y-4 p-4">
          <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Field label="BaÅŸlangÄ±Ã§" name="from" type="date" defaultValue={query.from} />
            <Field label="BitiÅŸ" name="to" type="date" defaultValue={query.to} />
            <SelectField
              label="BÃ¶lÃ¼m"
              name="departmentId"
              defaultValue={query.departmentId ?? ""}
              options={[{ value: "", label: "TÃ¼mÃ¼" }, ...filters.departments.map((department) => ({ value: department.id, label: department.name }))]}
            />
            <SelectField
              label="SÄ±nÄ±f"
              name="classId"
              defaultValue={query.classId ?? ""}
              options={[{ value: "", label: "TÃ¼mÃ¼" }, ...filters.classes.map((classRow) => ({ value: classRow.id, label: classRow.name }))]}
            />
            <div className="xl:col-span-2">
              <Field label="Arama" name="search" type="search" defaultValue={query.search} placeholder="BaÅŸlÄ±k, sÄ±nÄ±f, bÃ¶lÃ¼m, alan" />
            </div>
            <div className="flex items-end gap-2 xl:col-span-2">
              <Button type="submit">Filtrele</Button>
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
              <h2 className="text-base font-semibold text-[#093657]">Namaz YoklamasÄ± OturumlarÄ±</h2>
              <p className="text-sm text-muted-foreground">
                {prayerRows.length} oturum Â· {reportData.summary.prayerSessionCount} toplam namaz oturumu
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
      <Input
        type={type}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="h-10"
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
