import { AttendanceStatusBadge, AttendanceStatusLabel, AttendanceTypeBadge } from "@/components/attendance/attendance-badges";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { attendanceTypeDescriptions } from "@/lib/attendance/constants";
import type { AttendanceStudentSummary } from "@/lib/attendance/queries";

export function StudentAttendanceSummaryPanel({ summary }: { summary: AttendanceStudentSummary }) {
  if (!summary.student) {
    return <EmptyState title="Bu talebe için yoklama verisi bulunamadı." />;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Aylık Özet</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 xl:grid-cols-2">
          <SummaryBox
            title="Günlük Yoklama"
            items={[
              { label: "Alınan", value: summary.daily.takenCount },
              { label: "Var", value: summary.daily.presentCount },
              { label: "Yok", value: summary.daily.absentCount },
              { label: "İzinli", value: summary.daily.excusedCount },
              { label: "Geç", value: summary.daily.lateCount },
            ]}
          />
          <SummaryBox
            title="Namaz Yoklaması"
            items={summary.prayers.map((prayer) => ({
              label: prayer.label,
              value: `Alınan ${prayer.takenClassCount} · Var ${prayer.presentCount} · Yok ${prayer.absentCount} · Mazeret ${prayer.excusedCount} · Geç ${prayer.lateCount}`,
            }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Yoklama Geçmişi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {summary.entries.length > 0 ? (
            summary.entries.map((entry) => (
              <div key={entry.id} className="rounded-md border border-border bg-[#f8fafc] p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-[#093657]">{formatDate(entry.session.attendance_date)}</p>
                    <p className="text-sm text-muted-foreground">{attendanceTypeDescriptions[entry.session.attendance_type]}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <AttendanceTypeBadge type={entry.session.attendance_type} />
                    <AttendanceStatusBadge status={entry.session.completion_status} />
                  </div>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
                  <span>
                    Durum: <AttendanceStatusLabel status={entry.status} type={entry.session.attendance_type} />
                  </span>
                  <span>Not: {entry.note ?? "-"}</span>
                  <span>Yoklamayı alan: {entry.session.taken_by_profile?.full_name ?? "-"}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Bu talebe için henüz yoklama geçmişi yok.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryBox({ title, items }: { title: string; items: Array<{ label: string; value: string | number }> }) {
  return (
    <div className="rounded-md border border-border bg-[#f8fafc] p-3">
      <p className="text-sm font-semibold text-[#093657]">{title}</p>
      <div className="mt-3 space-y-2 text-sm">
        {items.map((item) => (
          <div key={`${title}-${item.label}`} className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">{item.label}</span>
            <span className="font-medium text-foreground">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(new Date(value));
}
