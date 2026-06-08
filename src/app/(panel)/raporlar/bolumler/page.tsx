import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { ReportShortcutCard } from "@/components/reports/report-shortcut-card";
import { RichProfileCard } from "@/components/profiles/rich-profile-card";
import { StudentMiniCard } from "@/components/students/student-mini-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth";
import { DEPARTMENT_CAPACITY, getDepartmentAnalyticsForProfile, type DepartmentAnalytics } from "@/lib/departments/analytics";

export default async function DepartmentReportsPage() {
  const { profile } = await requireAuth();
  const departments = await getDepartmentAnalyticsForProfile(profile);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="PDF Merkezi"
        title="Bölüm Raporları"
        description="Bölüm raporu, başarı özeti ve sınıf bazlı PDF çıktıları."
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <ReportShortcutCard
          title="Bölüm Raporu PDF"
          description="Müdür, sınıf, talebe ve doluluk özetleri."
          href="/raporlar"
          badge="Genel"
        />
        <ReportShortcutCard
          title="Bölüm Başarı Raporu PDF"
          description="Dönem sonu başarı, kanaat ve devamsızlık özeti."
          href="/raporlar/donem-sonu"
          badge="Dönem"
        />
      </div>

      {departments.length > 0 ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {departments.map((department) => (
            <DepartmentReportCard key={department.id} department={department} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">Görüntülenecek bölüm bulunamadı.</CardContent>
        </Card>
      )}
    </div>
  );
}

function DepartmentReportCard({ department }: { department: DepartmentAnalytics }) {
  return (
    <Card className="bg-white">
      <CardContent className="space-y-4 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[#093657]">{department.name}</h2>
            <p className="text-sm text-muted-foreground">{department.description ?? "Bölüm açıklaması yok."}</p>
          </div>
          <Badge variant={department.is_active ? "default" : "outline"}>{department.is_active ? "Aktif" : "Pasif"}</Badge>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <MiniStat label="Talebe" value={department.active_student_count} />
          <MiniStat label="Sınıf" value={department.active_class_count} />
          <MiniStat label="Hoca" value={department.teacher_count} />
          <MiniStat label="Doluluk" value={formatPercentOfCapacity(department.occupancy_percent)} />
        </div>

        <RichProfileCard
          profile={department.department_manager}
          title="Bölüm müdürü"
          href={department.department_manager ? `/kullanicilar/${department.department_manager.id}` : undefined}
          compact
          showStatus
          showAuth
        />

        <div className="flex flex-wrap gap-2">
          <Link href={`/bolumler/${department.id}/pdf`} target="_blank" rel="noreferrer" className="text-sm font-medium text-[#093657] hover:underline">
            Bölüm Raporu PDF
          </Link>
          <span className="text-muted-foreground">·</span>
          <Link href={`/raporlar/yoklama?departmentId=${department.id}`} className="text-sm font-medium text-[#093657] hover:underline">
            Bölüm Yoklama PDF
          </Link>
          <span className="text-muted-foreground">·</span>
          <Link href={`/raporlar/donem-sonu?departmentId=${department.id}`} className="text-sm font-medium text-[#093657] hover:underline">
            Bölüm Başarı Raporu PDF
          </Link>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-[#093657]">Sınıflar</h3>
          <div className="space-y-2">
            {department.classes.slice(0, 3).map((classRow) => (
              <div key={classRow.id} className="rounded-md border border-border bg-[#f8fafc] p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-[#093657]">{classRow.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {classRow.department?.name ?? "Bölüm yok"} · {classRow.active_student_count} talebe
                    </p>
                  </div>
                  <Badge variant={classRow.is_active ? "default" : "outline"}>{classRow.is_active ? "Aktif" : "Pasif"}</Badge>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
                  <RichProfileCard
                    profile={classRow.class_teacher}
                    href={classRow.class_teacher ? `/hocalar/${classRow.class_teacher.id}` : undefined}
                    compact
                    className="border-0 bg-transparent p-0 shadow-none hover:bg-transparent"
                  />
                  <Link href={`/siniflar/${classRow.id}/pdf`} target="_blank" rel="noreferrer" className="self-start text-sm font-medium text-[#093657] hover:underline">
                    Sınıf PDF
                  </Link>
                </div>
                {classRow.students.length > 0 ? (
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    {classRow.students.slice(0, 2).map((student) => (
                      <StudentMiniCard key={student.id} student={student} />
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
            {department.classes.length > 3 ? <p className="text-xs text-muted-foreground">+ {department.classes.length - 3} sınıf daha</p> : null}
          </div>
        </div>
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

function formatPercentOfCapacity(value: number | null) {
  return value === null ? "Veri yok" : `${value.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}% / ${DEPARTMENT_CAPACITY}`;
}
