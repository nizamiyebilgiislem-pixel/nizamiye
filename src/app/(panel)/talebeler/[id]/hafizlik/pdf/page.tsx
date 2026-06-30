import { notFound, redirect } from "next/navigation";

import { PrintableReportShell } from "@/components/reports/printable-report-shell";
import { StudentAvatar } from "@/components/students/student-avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireAuth } from "@/lib/auth";
import { canViewStudent } from "@/lib/students/permissions";
import { getStudentById } from "@/lib/students/queries";
import { getHafizlikProgress } from "@/lib/hafizlik/actions";
import { logPdfGenerated } from "@/lib/reports/actions";

export default async function StudentHafizlikPdfPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { profile } = await requireAuth();
  const student = await getStudentById(id);

  if (!student) {
    notFound();
  }

  if (profile.role === "veli") {
    redirect("/raporlar?error=unauthorized");
  } else if (!canViewStudent(profile, student.course_class)) {
    redirect("/raporlar?error=unauthorized");
  }

  const { data: progress } = await getHafizlikProgress(student.id);

  await logPdfGenerated(profile, {
    reportType: "student_hafizlik_statement",
    entityType: "student",
    entityId: student.id,
    studentId: student.id,
    title: `${student.full_name} Hafızlık Karnesi`,
    description: `${student.full_name} için hafızlık karnesi oluşturuldu.`,
  });

  const progressPercentage = progress
    ? Math.round(((progress.current_juz - 1) * 604 + progress.current_page) / 604 * 100)
    : 0;

  const statusLabels = {
    learning: "Öğreniyor",
    reviewing: "Tekrar",
    completed: "Tamamlandı",
  };

  const daysRemaining = progress?.target_completion_date
    ? Math.ceil((new Date(progress.target_completion_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <PrintableReportShell
      title="Hafızlık Karnesi"
      subtitle="Cüz ve sayfa bazlı hafızlık ilerleme takibi."
      backHref={`/talebeler/${student.id}?tab=hafizlik`}
      meta={
        <>
          <Badge variant="outline">Talebe: {student.full_name}</Badge>
          <Badge variant="outline">{student.department?.name ?? "Bölüm yok"}</Badge>
          <Badge variant="outline">{student.course_class?.name ?? "Sınıf yok"}</Badge>
        </>
      }
    >
      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="flex items-start gap-4">
            <StudentAvatar name={student.full_name} photoUrl={student.photo_url} size="lg" previewable />
            <div>
              <h2 className="text-2xl font-semibold text-[#093657]">{student.full_name}</h2>
              <p className="text-sm text-muted-foreground">
                {student.department?.name ?? "Bölüm yok"} · {student.course_class?.name ?? "Sınıf yok"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-4">
          <h3 className="text-lg font-semibold text-[#093657]">Güncel Durum</h3>
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
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
                <Badge variant="outline">{statusLabels[progress.status]}</Badge>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-md border border-border bg-white p-3">
                  <p className="text-xs text-muted-foreground">Mevcut Cüz</p>
                  <p className="mt-1 text-xl font-semibold text-[#093657]">{progress.current_juz}. Cüz</p>
                </div>
                <div className="rounded-md border border-border bg-white p-3">
                  <p className="text-xs text-muted-foreground">Mevcut Sayfa</p>
                  <p className="mt-1 text-xl font-semibold text-[#093657]">{progress.current_page}</p>
                </div>
                <div className="rounded-md border border-border bg-white p-3">
                  <p className="text-xs text-muted-foreground">Tamamlanan</p>
                  <p className="mt-1 text-xl font-semibold text-[#093657]">
                    {Math.floor((progress.current_juz - 1) * 604 + progress.current_page)} sayfa
                  </p>
                </div>
              </div>

              {progress.target_completion_date && (
                <div className="rounded-md border border-border bg-white p-3">
                  <p className="text-xs text-muted-foreground">Hedef Tamamlama</p>
                  <p className="mt-1 text-lg font-semibold text-[#093657]">
                    {new Date(progress.target_completion_date).toLocaleDateString("tr-TR")}
                    {daysRemaining !== null && daysRemaining > 0 && (
                      <span className="ml-2 text-sm font-normal text-muted-foreground">
                        ({daysRemaining} gün kaldı)
                      </span>
                    )}
                    {daysRemaining !== null && daysRemaining < 0 && (
                      <span className="ml-2 text-sm font-normal text-red-600">
                        ({Math.abs(daysRemaining)} gün geçmiş)
                      </span>
                    )}
                  </p>
                </div>
              )}

              {progress.teacher_note && (
                <div className="rounded-md border border-border bg-[#f8fafc] p-3">
                  <p className="text-xs text-muted-foreground">Hoca Notu</p>
                  <p className="mt-1 text-sm">{progress.teacher_note}</p>
                </div>
              )}
            </div>
          ) : (
            <EmptyState title="Hafızlık kaydı başlatılmamış." />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-4">
          <h3 className="text-lg font-semibold text-[#093657]">30 Cüz İlerleme</h3>
          <div className="grid grid-cols-10 gap-2">
            {Array.from({ length: 30 }, (_, i) => {
              const juz = i + 1;
              const isCompleted = progress && juz < progress.current_juz;
              const isCurrent = progress && juz === progress.current_juz;
              const isPending = progress && juz > progress.current_juz;
              const hasNoProgress = !progress;

              let bgColor = "bg-gray-100";
              if (isCompleted) bgColor = "bg-green-500 text-white";
              else if (isCurrent) bgColor = "bg-blue-500 text-white";
              else if (isPending) bgColor = "bg-gray-200";
              else if (hasNoProgress) bgColor = "bg-gray-100";

              return (
                <div
                  key={juz}
                  className={`flex aspect-square items-center justify-center rounded-md text-sm font-medium ${bgColor}`}
                >
                  {juz}
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-1">
              <div className="size-3 rounded bg-green-500" />
              <span>Tamamlandı</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="size-3 rounded bg-blue-500" />
              <span>Devam Ediyor</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="size-3 rounded bg-gray-200" />
              <span>Başlanmadı</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </PrintableReportShell>
  );
}