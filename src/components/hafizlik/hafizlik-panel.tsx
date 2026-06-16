import { BookOpen } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { HafizlikProgressRow } from "@/types/database";

const statusLabels = {
  learning: "Öğreniyor",
  reviewing: "Tekrar",
  completed: "Tamamlandı",
};

const statusColors = {
  learning: "bg-blue-100 text-blue-800",
  reviewing: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
};

export function HafizlikPanel({
  studentName,
  progress,
}: {
  studentName: string;
  progress: HafizlikProgressRow | null;
}) {
  const progressPercentage = progress
    ? Math.round(((progress.current_juz - 1) * 604 + progress.current_page) / 604 * 100)
    : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 pb-3">
        <BookOpen className="size-5 text-[#093657]" />
        <div>
          <CardTitle className="text-sm">Hafızlık Takibi</CardTitle>
          <CardDescription className="text-xs">{studentName} için hafızlık ilerlemesi</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {progress ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between text-sm">
                  <span>
                    {progress.current_juz}. Cüz · Sayfa {progress.current_page}
                  </span>
                  <span className="font-medium">{progressPercentage}%</span>
                </div>
                <div className="mt-2 h-4 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
              <span className={cn("rounded-full px-3 py-1 text-xs font-medium", statusColors[progress.status])}>
                {statusLabels[progress.status]}
              </span>
            </div>

            <div className="grid gap-2 md:grid-cols-3">
              <div className="rounded-md border border-border bg-white p-3">
                <p className="text-xs text-muted-foreground">Mevcut Cüz</p>
                <p className="mt-1 text-lg font-semibold text-[#093657]">{progress.current_juz}. Cüz</p>
              </div>
              <div className="rounded-md border border-border bg-white p-3">
                <p className="text-xs text-muted-foreground">Mevcut Sayfa</p>
                <p className="mt-1 text-lg font-semibold text-[#093657]">{progress.current_page}</p>
              </div>
              <div className="rounded-md border border-border bg-white p-3">
                <p className="text-xs text-muted-foreground">Tamamlanan</p>
                <p className="mt-1 text-lg font-semibold text-[#093657]">
                  {Math.floor((progress.current_juz - 1) * 604 + progress.current_page)} sayfa
                </p>
              </div>
            </div>

            {progress.target_completion_date && (
              <div className="rounded-md border border-border bg-white p-3">
                <p className="text-xs text-muted-foreground">Hedef Tamamlama</p>
                <p className="mt-1 text-sm font-medium text-[#093657]">
                  {new Date(progress.target_completion_date).toLocaleDateString("tr-TR")}
                </p>
              </div>
            )}

            {progress.teacher_note && (
              <div className="rounded-md border border-border bg-[#f8fafc] p-3">
                <p className="text-xs text-muted-foreground">Hoca Notu</p>
                <p className="mt-1 text-sm">{progress.teacher_note}</p>
              </div>
            )}

            <div className="rounded-md bg-slate-50 p-3">
              <p className="text-xs text-muted-foreground">30 Cüz İlerleme</p>
              <div className="mt-2 grid grid-cols-10 gap-1">
                {Array.from({ length: 30 }, (_, i) => {
                  const juz = i + 1;
                  const isCompleted = juz < progress.current_juz;
                  const isCurrent = juz === progress.current_juz;
                  const isPending = juz > progress.current_juz;

                  let bgColor = "bg-gray-100";
                  if (isCompleted) bgColor = "bg-green-500";
                  else if (isCurrent) bgColor = "bg-blue-500";
                  else if (isPending) bgColor = "bg-gray-200";

                  return (
                    <div
                      key={juz}
                      className={cn("flex aspect-square items-center justify-center rounded text-xs font-medium text-white", bgColor)}
                    >
                      {juz}
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <div className="size-2 rounded bg-green-500" /> Tamamlandı
                </span>
                <span className="flex items-center gap-1">
                  <div className="size-2 rounded bg-blue-500" /> Devam
                </span>
                <span className="flex items-center gap-1">
                  <div className="size-2 rounded bg-gray-200" /> Bekleniyor
                </span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Hafızlık kaydı bulunamadı.</p>
        )}
      </CardContent>
    </Card>
  );
}