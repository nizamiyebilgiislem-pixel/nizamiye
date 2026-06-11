import { CalendarClock, FileText, Stethoscope, Users } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/terms/academic-terms-management-table";
import type { AcademicTermDetail } from "@/lib/terms/management-queries";

export function AcademicTermDetailPanel({ detail }: { detail: AcademicTermDetail }) {
  const metrics = [
    ["Snapshot", detail.snapshotCount],
    ["Öğrenci", detail.studentCount],
    ["Not", detail.gradeCount],
    ["Kanaat", detail.evaluationCount],
    ["Yoklama oturumu", detail.attendanceSessionCount],
    ["Yoklama kaydı", detail.attendanceRecordCount],
    ["Revir", detail.infirmaryRecordCount],
  ] as const;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            {detail.name}
            <StatusBadge status={detail.status} />
          </CardTitle>
          <CardDescription>Bu sayfa dönem geçmişini yalnızca görüntüleme amacıyla gösterir.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Info label="Dönem ID" value={detail.id} />
          <Info label="Başlangıç" value={formatDate(detail.start_date)} />
          <Info label="Bitiş" value={formatDate(detail.end_date)} />
          <Info label="Oluşturma" value={formatDateTime(detail.created_at)} />
          <Info label="Kapanış" value={formatDateTime(detail.closed_at)} />
          <Info label="Kapatan" value={detail.closedByProfile?.full_name ?? "-"} />
          <Info label="Aktif mi?" value={detail.is_active ? "Evet" : "Hayır"} />
          <Info label="Güncel mi?" value={detail.is_current ? "Evet" : "Hayır"} />
        </CardContent>
      </Card>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([label, value]) => (
          <Card key={label} size="sm">
            <CardContent className="p-4">
              <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
              <p className="mt-2 text-xl font-semibold text-[#093657]">{formatNumber(value)}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Kapanış Durumu</CardTitle>
          <CardDescription>Son dönem kapatma operasyonu ve snapshot bilgisi.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Info icon={<CalendarClock className="size-4" aria-hidden="true" />} label="Closure run" value={detail.latestClosureRun?.status ?? "-"} />
          <Info icon={<FileText className="size-4" aria-hidden="true" />} label="Hata" value={detail.latestClosureRun?.error_message ?? "-"} />
          <Info icon={<Users className="size-4" aria-hidden="true" />} label="Snapshot sayısı" value={formatNumber(detail.snapshotCount)} />
          <Info icon={<Stethoscope className="size-4" aria-hidden="true" />} label="Revir kaydı" value={formatNumber(detail.infirmaryRecordCount)} />
        </CardContent>
      </Card>
    </div>
  );
}

function Info({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-[#f8fafc] p-3">
      <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function formatDate(value: string | null) {
  return value ? new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(new Date(value)) : "-";
}

function formatDateTime(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("tr-TR", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "-";
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("tr-TR").format(value);
}
