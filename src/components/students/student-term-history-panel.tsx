import Link from "next/link";
import { ArrowRight, CalendarClock, ClipboardList, FileText, GraduationCap, Stethoscope, UserRound, type LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildStudentTermHistoryView, type StudentTermHistoryItem } from "@/lib/terms/student-term-history";
import type { StudentTermSnapshotWithRelations } from "@/lib/terms/queries";
import type { AcademicTermStatus } from "@/types/database";
import { cn } from "@/lib/utils";

type StudentTermHistoryPanelProps = {
  snapshots: StudentTermSnapshotWithRelations[];
};

export function StudentTermHistoryPanel({ snapshots }: StudentTermHistoryPanelProps) {
  if (snapshots.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">Bu talebe için dönem geçmişi yok.</CardContent>
      </Card>
    );
  }

  const { items, comparison } = buildStudentTermHistoryView(snapshots);

  return (
    <div className="space-y-4">
      {comparison ? <TermComparisonCard comparison={comparison} /> : null}
      <div className="grid gap-4 xl:grid-cols-2">
        {items.map((item) => (
          <TermSnapshotCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

function TermComparisonCard({ comparison }: { comparison: { previous: StudentTermHistoryItem; latest: StudentTermHistoryItem } }) {
  const previousAbsence = comparison.previous.attendanceSummary.absent;
  const latestAbsence = comparison.latest.attendanceSummary.absent;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dönem Karşılaştırması</CardTitle>
        <CardDescription>
          {comparison.previous.termName} ile {comparison.latest.termName} özeti.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-3">
        <ComparisonMetric label="Not Ortalaması" previous={formatAverage(comparison.previous.gradeAverage)} latest={formatAverage(comparison.latest.gradeAverage)} />
        <ComparisonMetric label="Devamsızlık" previous={formatNumber(previousAbsence)} latest={formatNumber(latestAbsence)} />
        <ComparisonMetric label="Revir Başvurusu" previous={formatNumber(comparison.previous.infirmarySummary.total)} latest={formatNumber(comparison.latest.infirmarySummary.total)} />
      </CardContent>
    </Card>
  );
}

function TermSnapshotCard({ item }: { item: StudentTermHistoryItem }) {
  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex flex-wrap items-center gap-2">
              {item.termName}
              <StatusBadge status={item.termStatus} />
            </CardTitle>
            <CardDescription>
              {item.departmentName} · {item.className}
            </CardDescription>
          </div>
          <Link href={`/sistem/donem-yonetimi/${item.termId}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Dönem Detayı
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <InfoTile icon={CalendarClock} label="Snapshot Tarihi" value={formatDateTime(item.snapshotDate)} />
          <InfoTile icon={GraduationCap} label="Not Ortalaması" value={formatAverage(item.gradeAverage)} />
          <InfoTile icon={ClipboardList} label="Kanaat Özeti" value={formatEvaluation(item)} />
          <InfoTile icon={FileText} label="Yoklama Özeti" value={formatAttendance(item)} />
          <InfoTile icon={Stethoscope} label="Revir Özeti" value={formatInfirmary(item)} />
          <InfoTile icon={UserRound} label="Öğrenci Durumu" value={item.studentStatus} />
        </div>

        <details className="group rounded-md border border-border bg-[#f8fafc] p-3">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-[#093657]">
            Snapshot Detayı
            <ArrowRight className="size-4 transition-transform group-open:rotate-90" aria-hidden="true" />
          </summary>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <ReadonlySection
              title="Öğrenci"
              rows={[
                ["Ad Soyad", item.studentName],
                ["Bölüm", item.departmentName],
                ["Sınıf", item.className],
                ["Durum", item.studentStatus],
              ]}
            />
            <ReadonlySection
              title="Akademik"
              rows={[
                ["Ortalama", formatAverage(item.gradeAverage)],
                ["Not Kaydı", formatNumber(item.gradeCount)],
                ["Kanaat Kaydı", formatNumber(item.evaluationCount)],
                ["Genel Kanaat", item.evaluationSummary.generalOpinion ?? "-"],
              ]}
            />
            <ReadonlySection
              title="Yoklama ve Revir"
              rows={[
                ["Yoklama Toplam", formatNumber(item.attendanceSummary.total)],
                ["Devamsızlık", formatNumber(item.attendanceSummary.absent)],
                ["Geç Kalma", formatNumber(item.attendanceSummary.late)],
                ["Revir Kaydı", formatNumber(item.infirmarySummary.total)],
                ["Hastane Sevki", formatNumber(item.infirmarySummary.sentToHospital)],
              ]}
            />
          </div>
        </details>
      </CardContent>
    </Card>
  );
}

function InfoTile({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Icon className="size-4 text-[#093657]" aria-hidden="true" />
        {label}
      </div>
      <p className="mt-2 text-sm font-semibold text-[#093657]">{value}</p>
    </div>
  );
}

function ReadonlySection({ title, rows }: { title: string; rows: Array<[string, string]> }) {
  return (
    <section className="rounded-md border border-border bg-background p-3">
      <p className="text-sm font-semibold text-[#093657]">{title}</p>
      <div className="mt-3 space-y-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-start justify-between gap-3 text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="max-w-[60%] text-right font-medium">{value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ComparisonMetric({ label, previous, latest }: { label: string; previous: string; latest: string }) {
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 flex items-center gap-2 text-xl font-semibold text-[#093657]">
        <span>{previous}</span>
        <ArrowRight className="size-4 text-muted-foreground" aria-hidden="true" />
        <span>{latest}</span>
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: AcademicTermStatus }) {
  const labels: Record<AcademicTermStatus, string> = {
    draft: "Draft",
    active: "Active",
    closed: "Closed",
    archived: "Archived",
  };

  return <Badge variant={status === "active" ? "default" : "outline"}>{labels[status] ?? status}</Badge>;
}

function formatEvaluation(item: StudentTermHistoryItem) {
  if (!item.evaluationSummary.generalOpinion && item.evaluationCount === 0) {
    return "Kanaat yok";
  }

  const scores = [
    item.evaluationSummary.behaviorScore,
    item.evaluationSummary.attendanceScore,
    item.evaluationSummary.lessonPerformanceScore,
    item.evaluationSummary.disciplineScore,
    item.evaluationSummary.memorizationScore,
  ].filter((score): score is number => score !== null);

  if (scores.length === 0) {
    return item.evaluationSummary.generalOpinion ?? "Kanaat var";
  }

  const average = scores.reduce((total, score) => total + score, 0) / scores.length;
  return `${average.toFixed(1)} puan`;
}

function formatAttendance(item: StudentTermHistoryItem) {
  const { total, absent, excused, late } = item.attendanceSummary;
  if (total === 0) {
    return "Yoklama yok";
  }

  return `${formatNumber(total)} kayıt · ${formatNumber(absent)} devamsız · ${formatNumber(excused)} izinli · ${formatNumber(late)} geç`;
}

function formatInfirmary(item: StudentTermHistoryItem) {
  const { total, sentToHospital } = item.infirmarySummary;
  if (total === 0) {
    return "Revir kaydı yok";
  }

  return `${formatNumber(total)} kayıt · ${formatNumber(sentToHospital)} sevk`;
}

function formatAverage(value: number | null) {
  if (value === null) {
    return "-";
  }

  return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("tr-TR").format(value);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
