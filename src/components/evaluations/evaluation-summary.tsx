import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EvaluationWithRelations } from "@/lib/evaluations/queries";
import { cn } from "@/lib/utils";

export function EvaluationSummary({
  evaluations,
  studentId,
  canEdit,
}: {
  evaluations: EvaluationWithRelations[];
  studentId: string;
  canEdit: boolean;
}) {
  return (
    <Card>
      <CardHeader className="gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>Kanaatler</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">Dönem bazlı değerlendirme kayıtları.</p>
        </div>
        {canEdit ? (
          <Link href={`/kanaat-sistemi/kanaat-girisi/${studentId}`} className={cn(buttonVariants())}>
            Kanaat Düzenle
          </Link>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {evaluations.length > 0 ? (
          evaluations.map((evaluation) => (
            <div key={evaluation.id} className="rounded-md border border-border bg-background p-4">
              <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                <h3 className="font-semibold">{evaluation.term?.name ?? "Dönem yok"}</h3>
                <p className="text-sm text-muted-foreground">
                  {evaluation.created_by_profile?.full_name ?? "-"} · {formatDate(evaluation.created_at)}
                </p>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-5">
                <Score label="Davranış" value={evaluation.behavior_score} />
                <Score label="Devam" value={evaluation.attendance_score} />
                <Score label="Ders Performansı" value={evaluation.lesson_performance_score} />
                <Score label="Disiplin" value={evaluation.discipline_score} />
                <Score label="Ezber/Hafızlık" value={evaluation.memorization_score} />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{evaluation.general_opinion ?? "Genel kanaat girilmedi."}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">Kanaat kaydı bulunamadı.</p>
        )}
      </CardContent>
    </Card>
  );
}

function Score({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-md border border-border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value ?? "-"}</p>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(new Date(value));
}
