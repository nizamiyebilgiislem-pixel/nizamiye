import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireAuth } from "@/lib/auth";
import { getAttendanceFilterOptions, getAttendanceReportData } from "@/lib/attendance/queries";
import { attendanceTypes } from "@/lib/attendance/constants";

type AttendanceReportsPageProps = {
  searchParams: Promise<{
    from?: string;
    to?: string;
    attendanceType?: string;
    departmentId?: string;
    classId?: string;
    reportType?: string;
  }>;
};

export default async function AttendanceReportsPage({ searchParams }: AttendanceReportsPageProps) {
  const query = await searchParams;
  const { profile } = await requireAuth();
  const [{ summary, rows }, options] = await Promise.all([
    getAttendanceReportData(profile, {
      from: query.from,
      to: query.to,
      attendanceType: normalizeAttendanceType(query.attendanceType),
      departmentId: query.departmentId,
      classId: query.classId,
      status: "all",
    }),
    getAttendanceFilterOptions(profile),
  ]);

  const reportType = normalizeReportType(query.reportType);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Yoklama Raporları"
        title="Raporlar"
        description="Günlük sınıf yoklaması ve namaz yoklamaları için tarih aralığına göre rapor üretin."
      />

      <Card>
        <CardContent className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-4">
          <Metric label="Toplam Oturum" value={summary.totalSessions} />
          <Metric label="Tamamlanan" value={summary.completedSessionCount} />
          <Metric label="Taslak" value={summary.draftSessionCount} />
          <Metric label="Toplam Kayıt" value={summary.totalRecords} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <form className="grid gap-3 xl:grid-cols-6" action="/yoklama/raporlar" method="get">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Tarih Başlangıç</label>
              <Input type="date" name="from" defaultValue={query.from} className="h-10" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Tarih Bitiş</label>
              <Input type="date" name="to" defaultValue={query.to} className="h-10" />
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
                {options.classes.map((classRow) => (
                  <option key={classRow.id} value={classRow.id}>
                    {classRow.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Rapor Tipi</label>
              <select name="reportType" defaultValue={reportType} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm">
                <option value="daily">Genel Günlük</option>
                <option value="prayer">Namaz Yoklaması</option>
              </select>
            </div>
            <div className="xl:col-span-6">
              <Button type="submit">Raporu Oluştur</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
          {reportType === "daily" ? (
            <>
              <Stat label="Günlük Var" value={summary.dailyRecords.presentCount} />
              <Stat label="Günlük Yok" value={summary.dailyRecords.absentCount} />
              <Stat label="Günlük İzinli" value={summary.dailyRecords.excusedCount} />
              <Stat label="Günlük Geç" value={summary.dailyRecords.lateCount} />
            </>
          ) : (
            <>
              <Stat label="Namaz Var" value={summary.prayerRecords.presentCount} />
              <Stat label="Namaz Yok" value={summary.prayerRecords.absentCount} />
              <Stat label="Namaz Mazeretli" value={summary.prayerRecords.excusedCount} />
              <Stat label="Namaz Geç" value={summary.prayerRecords.lateCount} />
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-[#f8fafc]">
              <tr className="[&>th]:px-4 [&>th]:py-3 [&>th]:text-left [&>th]:font-medium [&>th]:text-muted-foreground">
                <th>Tarih</th>
                <th>Tür</th>
                <th>Sınıf</th>
                <th>Durum</th>
                <th>Özet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              {rows.length > 0 ? (
                rows.map((row) => (
                  <tr key={row.id} className="[&>td]:px-4 [&>td]:py-3">
                    <td>{formatDate(row.attendance_date)}</td>
                    <td>{row.filterLabel}</td>
                    <td>{row.course_class?.name ?? "-"}</td>
                    <td>{row.completion_status === "completed" ? "Tamamlandı" : "Taslak"}</td>
                    <td>
                      {row.record_count}/{row.active_student_count} kayıt · Var {row.present_count} · Yok {row.absent_count} · İzinli {row.excused_count} · Geç {row.late_count}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    Kayıt bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-[#f8fafc] p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-[#093657]">{value}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold text-[#093657]">{value}</p>
    </div>
  );
}

function normalizeAttendanceType(value?: string) {
  return value && attendanceTypes.includes(value as (typeof attendanceTypes)[number]) ? (value as (typeof attendanceTypes)[number]) : "all";
}

function normalizeReportType(value?: string) {
  return value === "prayer" ? "prayer" : "daily";
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(new Date(value));
}
