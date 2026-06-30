import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { ReportShortcutCard } from "@/components/reports/report-shortcut-card";
import { RichProfileCard } from "@/components/profiles/rich-profile-card";
import { StudentCompactCard } from "@/components/students/student-compact-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireAuth } from "@/lib/auth";
import { getDepartmentAnalyticsForProfile, type ClassAnalytics } from "@/lib/departments/analytics";

export default async function ClassReportsPage() {
  const { profile } = await requireAuth();
  const departments = await getDepartmentAnalyticsForProfile(profile);
  const classes = departments.flatMap((department) => department.classes);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="PDF Merkezi"
        title="Sınıf Raporları"
        description="Sınıf listesi, ders programı ve yoklama çıktılarına hızlı erişim."
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <ReportShortcutCard
          title="Sınıf Listesi PDF"
          description="Fotoğraflı öğrenci listesi ve temel sınıf bilgileri."
          href="/raporlar"
          badge="Genel"
        />
        <ReportShortcutCard
          title="Yoklama PDF"
          description="Seçili sınıf için günlük veya namaz yoklama raporları."
          href="/raporlar/yoklama"
          badge="Rapor"
        />
      </div>

      {classes.length > 0 ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {classes.map((classRow) => (
            <ClassReportCard key={classRow.id} classRow={classRow} />
          ))}
        </div>
      ) : (
        <EmptyState title="Görüntülenecek sınıf bulunamadı." />
      )}
    </div>
  );
}

function ClassReportCard({ classRow }: { classRow: ClassAnalytics }) {
  return (
    <Card className="bg-white">
      <CardContent className="space-y-4 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[#093657]">{classRow.name}</h2>
            <p className="text-sm text-muted-foreground">{classRow.department?.name ?? "Bölüm yok"}</p>
          </div>
          <Badge variant={classRow.is_active ? "default" : "outline"}>{classRow.is_active ? "Aktif" : "Pasif"}</Badge>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <MiniStat label="Talebe" value={classRow.active_student_count} />
          <MiniStat label="Ders" value={classRow.active_course_count} />
          <MiniStat label="Program" value={classRow.has_schedule ? "Var" : "Yok"} />
          <MiniStat label="Başarı" value={formatAverage(classRow.success_average)} />
        </div>

        <div className="rounded-md border border-border bg-[#f8fafc] p-3">
          <div className="flex items-center justify-between gap-3">
            <RichProfileCard
              profile={classRow.class_teacher}
              href={classRow.class_teacher ? `/hocalar/${classRow.class_teacher.id}` : undefined}
              compact
              className="border-0 bg-transparent p-0 shadow-none hover:bg-transparent"
            />
            <div className="flex flex-wrap gap-2">
              <Link href={`/siniflar/${classRow.id}/pdf`} target="_blank" rel="noreferrer" className="text-sm font-medium text-[#093657] hover:underline">
                Sınıf Listesi PDF
              </Link>
              <span className="text-muted-foreground">·</span>
              <Link href={`/siniflar/${classRow.id}/ders-programi-yazdir`} target="_blank" rel="noreferrer" className="text-sm font-medium text-[#093657] hover:underline">
                Ders Programı PDF
              </Link>
              <span className="text-muted-foreground">·</span>
              <Link href={`/raporlar/yoklama?classId=${classRow.id}`} className="text-sm font-medium text-[#093657] hover:underline">
                Yoklama PDF
              </Link>
            </div>
          </div>
        </div>

        {classRow.students.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {classRow.students.slice(0, 4).map((student) => (
              <StudentCompactCard key={student.id} student={student} />
            ))}
          </div>
        ) : (
          <EmptyState title="Bu sınıf için aktif talebe yok." />
        )}
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md border border-border bg-white p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#093657]">{value}</p>
    </div>
  );
}

function formatAverage(value: number | null) {
  return value === null ? "Veri yok" : value.toLocaleString("tr-TR", { maximumFractionDigits: 2 });
}
