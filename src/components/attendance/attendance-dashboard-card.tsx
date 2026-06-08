import { AlertTriangle } from "lucide-react";

import { AttendanceStatusBadge } from "@/components/attendance/attendance-badges";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AttendanceDashboardSummary } from "@/lib/attendance/queries";

export function AttendanceDashboardCard({ summary }: { summary: AttendanceDashboardSummary }) {
  return (
    <Card size="sm">
      <CardHeader className="border-b border-border">
        <CardTitle>Bugünkü Yoklama Özeti</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        <section className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-[#093657]">Günlük Yoklama</h3>
            <AttendanceStatusBadge status="completed" />
          </div>
          <SummaryGrid
            taken={summary.daily.takenClassCount}
            missing={summary.daily.missingClassCount}
            present={summary.daily.presentCount}
            absent={summary.daily.absentCount}
            excused={summary.daily.excusedCount}
            late={summary.daily.lateCount}
          />
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-[#093657]">Namaz Yoklaması</h3>
            {summary.mostMissingPrayer ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-900">
                <AlertTriangle className="size-3.5" aria-hidden="true" />
                En eksik: {summary.mostMissingPrayer.label}
              </span>
            ) : null}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {summary.prayers.map((prayer) => (
              <div key={prayer.type} className="rounded-md border border-border bg-[#f8fafc] p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">{prayer.label}</p>
                  <span className="text-xs text-muted-foreground">{prayer.takenClassCount} alınan</span>
                </div>
                <SummaryBar
                  taken={prayer.takenClassCount}
                  missing={prayer.missingClassCount}
                  present={prayer.presentCount}
                  absent={prayer.absentCount}
                  excused={prayer.excusedCount}
                  late={prayer.lateCount}
                />
              </div>
            ))}
          </div>
        </section>
      </CardContent>
    </Card>
  );
}

function SummaryGrid({
  taken,
  missing,
  present,
  absent,
  excused,
  late,
}: {
  taken: number;
  missing: number;
  present: number;
  absent: number;
  excused: number;
  late: number;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-6">
      <Stat label="Alınan" value={taken} />
      <Stat label="Alınmayan" value={missing} />
      <Stat label="Katılan" value={present} />
      <Stat label="Katılmayan" value={absent} />
      <Stat label="Mazeretli" value={excused} />
      <Stat label="Geç" value={late} />
    </div>
  );
}

function SummaryBar(props: { taken: number; missing: number; present: number; absent: number; excused: number; late: number }) {
  return (
    <div className="mt-3 space-y-2">
      <div className="h-2 rounded-full bg-[#eaf1f6]">
        <div className="h-2 rounded-full bg-[#093657]" style={{ width: `${Math.max(4, Math.min(100, (props.taken / Math.max(props.taken + props.missing, 1)) * 100))}%` }} />
      </div>
      <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground">
        <span>Katılan {props.present}</span>
        <span>Katılmayan {props.absent}</span>
        <span>Mazeretli {props.excused}</span>
        <span>Geç {props.late}</span>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-background p-2 text-center">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold text-[#093657]">{value}</p>
    </div>
  );
}
