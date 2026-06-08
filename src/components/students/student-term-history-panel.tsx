import { ChevronDown, Clock3, FileText, GraduationCap, Stethoscope } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StudentTermSnapshotWithRelations } from "@/lib/terms/queries";

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

  return (
    <div className="space-y-4">
      {snapshots.map((snapshot) => {
        const data = snapshot.snapshot_data as SnapshotData;
        const grades = Array.isArray(data?.grades) ? data.grades : [];
        const evaluation = data?.evaluation ?? null;
        const infirmaryRecords = Array.isArray(data?.infirmary_records) ? data.infirmary_records : [];

        return (
          <Card key={snapshot.id}>
            <CardHeader className="flex-row items-start justify-between gap-3">
              <div className="space-y-1">
                <CardTitle className="flex flex-wrap items-center gap-2">
                  {snapshot.term?.name ?? "Dönem"}
                  <span className="rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    {snapshot.student_status ?? "-"}
                  </span>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {snapshot.department?.name ?? "-"} · {snapshot.classRow?.name ?? "-"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Meta icon={GraduationCap} label="Ortalama" value={snapshot.grade_average !== null ? snapshot.grade_average.toFixed(2) : "-"} />
                <Meta icon={FileText} label="Not" value={String(snapshot.total_grades)} />
                <Meta icon={Clock3} label="Kanaat" value={String(snapshot.total_evaluations)} />
                <Meta icon={Stethoscope} label="Revir" value={String(snapshot.total_infirmary_records)} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <details className="group rounded-md border border-border bg-[#f8fafc] p-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-[#093657]">
                  Dönem detaylarını göster
                  <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden="true" />
                </summary>
                <div className="mt-4 grid gap-4 xl:grid-cols-3">
                  <section className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Snapshot özeti</p>
                    <pre className="max-h-72 overflow-auto rounded-md border border-border bg-background p-3 text-xs leading-6 text-foreground">
                      {prettyJson(data)}
                    </pre>
                  </section>
                  <section className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notlar</p>
                    <div className="space-y-2">
                      {grades.length > 0 ? (
                        grades.map((grade, index) => (
                          <div key={`${snapshot.id}-grade-${index}`} className="rounded-md border border-border bg-background p-3 text-sm">
                            <p className="font-medium text-[#093657]">{valueOrFallback(grade.course_id, "Ders")}</p>
                            <p className="mt-1 text-muted-foreground">
                              Not: {valueOrFallback(grade.grade, "-")} {grade.note ? `· ${String(grade.note)}` : ""}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">Bu dönem için not kaydı yok.</p>
                      )}
                    </div>
                  </section>
                  <section className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Kanaat ve revir</p>
                    <div className="space-y-2">
                      {evaluation ? (
                        <div className="rounded-md border border-border bg-background p-3 text-sm">
                          <p className="font-medium text-[#093657]">Kanaat Özeti</p>
                          <p className="mt-1 text-muted-foreground">{evaluation.general_opinion ?? "Kanaat girilmemiş."}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Bu dönem için kanaat kaydı yok.</p>
                      )}
                      <div className="rounded-md border border-border bg-background p-3 text-sm">
                        <p className="font-medium text-[#093657]">Revir</p>
                        <p className="mt-1 text-muted-foreground">{infirmaryRecords.length} kayıt</p>
                      </div>
                    </div>
                  </section>
                </div>
              </details>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function Meta({ icon: Icon, label, value }: { icon: typeof GraduationCap; label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1">
      <Icon className="size-3.5" aria-hidden="true" />
      {label}: {value}
    </span>
  );
}

function prettyJson(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

type SnapshotData = {
  grades?: SnapshotGrade[];
  evaluation?: SnapshotEvaluation;
  infirmary_records?: SnapshotInfirmaryRecord[];
} | null;

type SnapshotGrade = {
  course_id?: string | number | null;
  grade?: string | number | null;
  note?: string | null;
};

type SnapshotEvaluation = {
  general_opinion?: string | null;
} | null;

type SnapshotInfirmaryRecord = Record<string, unknown>;

function valueOrFallback(value: unknown, fallback: string) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  return String(value);
}
