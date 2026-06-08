import Link from "next/link";

import { AttendanceDashboardCard } from "@/components/attendance/attendance-dashboard-card";
import { PageHeader } from "@/components/layout/page-header";
import { PdfPrintButton } from "@/components/reports/pdf-print-button";
import { ReportShortcutCard } from "@/components/reports/report-shortcut-card";
import { StudentAvatar } from "@/components/students/student-avatar";
import { Card, CardContent } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth";
import { getAttendanceDashboardSummary } from "@/lib/attendance/queries";
import { getDashboardData } from "@/lib/dashboard/queries";
import { getEvaluationDashboardSummary } from "@/lib/evaluations/queries";
import { getGradeDashboardSummary } from "@/lib/grades/queries";
import { getInfirmaryDashboardSummary } from "@/lib/infirmary/queries";
import { logPdfGenerated } from "@/lib/reports/actions";
import { getActiveTerms } from "@/lib/terms/queries";

export default async function TermEndReportsPage() {
  const { profile } = await requireAuth();
  const [dashboard, grades, evaluations, infirmary, attendance, activeTerms] = await Promise.all([
    getDashboardData(profile),
    getGradeDashboardSummary(profile),
    getEvaluationDashboardSummary(profile),
    getInfirmaryDashboardSummary(profile),
    getAttendanceDashboardSummary(profile),
    getActiveTerms(),
  ]);
  const activeTerm = activeTerms[0] ?? null;

  await logPdfGenerated(profile, {
    reportType: "term_end_report",
    entityType: "report",
    entityId: activeTerm?.id ?? "active-term",
    title: "Dönem Sonu Akademik Rapor PDF",
    description: "Dönem sonu akademik raporu oluşturuldu.",
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/raporlar" className="text-sm font-medium text-[#093657] hover:underline">
          Raporlar&apos;a dön
        </Link>
        <PdfPrintButton />
      </div>

      <PageHeader
        eyebrow="Raporlar"
        title="Dönem Sonu Akademik Rapor"
        description="Başarı, devamsızlık, kanaat ve revir verilerini tek resmi çıktıda toplayın."
      />

      <Card size="sm">
        <CardContent className="grid gap-3 p-4 md:grid-cols-4">
          <Metric label="Aktif dönem" value={activeTerm?.name ?? "Yok"} />
          <Metric label="Aktif ders" value={grades.activeCourseCount} />
          <Metric label="Kanaat kaydı" value={evaluations.totalEvaluationCount} />
          <Metric label="Revir kaydı" value={infirmary.totalCount} />
        </CardContent>
      </Card>

      <AttendanceDashboardCard summary={attendance} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ReportShortcutCard title="Talebe Bilgi Formu PDF" description="Bireysel öğrenci bilgileri ve dönem özetleri." href="/raporlar/talebeler" badge="Bireysel" />
        <ReportShortcutCard title="Sınıf Listesi PDF" description="Sınıf, talebe ve hoca özetleri." href="/raporlar/siniflar" badge="Sınıf" />
        <ReportShortcutCard title="Bölüm Raporu PDF" description="Bölüm bazlı başarı ve doluluk özeti." href="/raporlar/bolumler" badge="Bölüm" />
      </div>

      <Card>
        <CardContent className="space-y-4 p-4">
          <h2 className="text-base font-semibold text-[#093657]">Öğrenci Özeti</h2>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {dashboard.latestStudents.slice(0, 6).map((student) => (
              <Link key={student.id} href={`/talebeler/${student.id}`} className="flex items-center gap-3 rounded-md border border-border bg-[#f8fafc] p-3 hover:bg-[#eef4f8]">
                <StudentAvatar name={student.full_name} photoUrl={student.photo_url} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[#093657]">{student.full_name}</p>
                  <p className="truncate text-xs text-muted-foreground">{student.course_class?.name ?? "Sınıf yok"} · {student.department?.name ?? "Bölüm yok"}</p>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md border border-border bg-[#f8fafc] p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold text-[#093657]">{value}</p>
    </div>
  );
}
