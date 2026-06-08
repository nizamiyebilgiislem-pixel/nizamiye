import Link from "next/link";
import type { ComponentType } from "react";
import {
  Activity,
  Building2,
  ClipboardList,
  FileText,
  GraduationCap,
  School,
  Stethoscope,
  UsersRound,
} from "lucide-react";

import { DepartmentOccupancyPanel } from "@/components/dashboard/department-occupancy-panel";
import { DepartmentStatusCard } from "@/components/dashboard/department-status-card";
import { DepartmentSuccessPanel } from "@/components/dashboard/department-success-panel";
import { AttendanceDashboardCard } from "@/components/attendance/attendance-dashboard-card";
import { DormitoryDashboardCard } from "@/components/dormitory/dormitory-dashboard-card";
import { PageHeader } from "@/components/layout/page-header";
import { ReportShortcutCard } from "@/components/reports/report-shortcut-card";
import { StudentAvatar } from "@/components/students/student-avatar";
import { StudentStatusBadge } from "@/components/students/student-status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth";
import { getAttendanceDashboardSummary } from "@/lib/attendance/queries";
import { getDormitoryDashboard } from "@/lib/dormitory/queries";
import { getDashboardData, type DashboardDistributionItem, type DashboardMetric } from "@/lib/dashboard/queries";
import { getDepartmentAnalyticsForProfile } from "@/lib/departments/analytics";
import { getActiveTerms } from "@/lib/terms/queries";

const metricIcons: Record<string, ComponentType<{ className?: string; "aria-hidden"?: boolean }>> = {
  "active-students": GraduationCap,
  teachers: UsersRound,
  "active-classes": School,
  "active-departments": Building2,
  infirmary: Stethoscope,
  evaluations: ClipboardList,
  documents: FileText,
  "scheduled-classes": Activity,
};

export default async function DashboardPage() {
  const { profile } = await requireAuth();
  const [dashboard, departments, activeTerms, attendanceSummary, dormitoryDashboard] = await Promise.all([
    getDashboardData(profile),
    getDepartmentAnalyticsForProfile(profile),
    getActiveTerms(),
    getAttendanceDashboardSummary(profile),
    getDormitoryDashboard(profile),
  ]);
  const activeTerm = activeTerms[0] ?? null;
  const visibleMetricKeys = new Set([
    "active-students",
    "teachers",
    "active-classes",
    "active-departments",
    "infirmary",
    "evaluations",
    "documents",
    "scheduled-classes",
  ]);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Yönetim Özeti"
        title="Dashboard"
        description="Bölüm durumu, doluluk, başarı ve operasyon kayıtlarını tek ekranda izleyin."
      />

      <Card size="sm" className="border-[#093657]/15 bg-white">
        <CardContent className="flex flex-col gap-2 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Aktif Dönem</p>
            <p className="mt-1 text-xl font-semibold text-[#093657]">{activeTerm?.name ?? "Aktif dönem tanımlı değil"}</p>
          </div>
          <p className="max-w-2xl text-sm text-muted-foreground">
            {activeTerm ? "Not ve başarı panelleri bu dönem verilerine göre hesaplanır." : "Not ve başarı panelleri için aktif dönem tanımlanmalıdır."}
          </p>
        </CardContent>
      </Card>

      <AttendanceDashboardCard summary={attendanceSummary} />
      <DormitoryDashboardCard dashboard={dormitoryDashboard} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ReportShortcutCard
          title="PDF Merkezi"
          description="Talebe, sınıf, bölüm ve dönem raporlarına hızlı erişim."
          href="/raporlar/talebeler"
          badge="Hızlı erişim"
        />
        <ReportShortcutCard
          title="Raporlar"
          description="Genel rapor merkezi ve resmi çıktılar."
          href="/raporlar"
          badge="Merkez"
        />
        <ReportShortcutCard
          title="Yoklama Raporu"
          description="Günlük ve namaz yoklaması özetleri."
          href="/raporlar/yoklama"
          badge="Operasyon"
        />
      </section>

      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-[#093657]">Bölümlerin Güncel Durumu</h2>
          <p className="text-sm text-muted-foreground">Yönetim ekranının ana özeti: müdür, doluluk, başarı ve program durumu.</p>
        </div>
        {departments.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
            {departments.map((department) => (
              <DepartmentStatusCard key={department.id} department={department} />
            ))}
          </div>
        ) : (
          <EmptyState text="Görüntülenecek bölüm bulunamadı." />
        )}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <DepartmentOccupancyPanel departments={departments} />
        <DepartmentSuccessPanel departments={departments} activeTermName={activeTerm?.name} />
      </section>

      <section className="space-y-3">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-[#093657]">Genel İstatistikler</h2>
          <p className="text-sm text-muted-foreground">Operasyonun genel hacmini hızlıca tarayın.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {dashboard.metrics.filter((metric) => visibleMetricKeys.has(metric.key)).map((metric) => (
            <MetricCard key={metric.key} metric={metric} />
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card size="sm">
            <CardHeader className="border-b border-border">
              <CardTitle>Son Eklenen Talebeler</CardTitle>
              <CardDescription>Yetki alanınızdaki en yeni talebe kayıtları.</CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-border p-0">
              {dashboard.latestStudents.length > 0 ? (
                dashboard.latestStudents.map((student) => (
                  <Link key={student.id} href={`/talebeler/${student.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-[#f4f8fc]">
                    <StudentAvatar name={student.full_name} photoUrl={student.photo_url} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{student.full_name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {student.department?.name ?? "Bölüm yok"} · {student.course_class?.name ?? "Sınıf yok"}
                      </p>
                    </div>
                    <StudentStatusBadge status={student.status} />
                  </Link>
                ))
              ) : (
                <EmptyState text="Henüz kayıt yok." />
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-3">
            <RecentStudentRecordsCard
              title="Son Revir Kayıtları"
              description="Sağlık birimindeki son işlemler."
              items={dashboard.latestInfirmaryRecords.map((record) => ({
                id: record.id,
                href: `/revir/${record.id}`,
                name: record.student?.full_name ?? "Talebe yok",
                photoUrl: record.student?.photo_url ?? null,
                meta: `${record.record_date} · ${record.complaint ?? "Şikayet girilmedi"}`,
              }))}
            />
            <RecentStudentRecordsCard
              title="Son Evraklar"
              description="Yüklenen en yeni talebe evrakları."
              items={dashboard.latestDocuments.map((document) => ({
                id: document.id,
                href: `/evraklar/${document.id}`,
                name: document.student?.full_name ?? "Talebe yok",
                photoUrl: document.student?.photo_url ?? null,
                meta: `${document.document_type} · ${formatDate(document.created_at)}`,
              }))}
            />
            <RecentStudentRecordsCard
              title="Son Kanaatler"
              description="Girilen en yeni kanaat kayıtları."
              items={dashboard.latestEvaluations.map((evaluation) => ({
                id: evaluation.id,
                href: `/kanaat-sistemi/kanaat-girisi/${evaluation.student_id}`,
                name: evaluation.student?.full_name ?? "Talebe yok",
                photoUrl: evaluation.student?.photo_url ?? null,
                meta: evaluation.general_opinion ?? formatDate(evaluation.created_at),
              }))}
            />
          </div>
        </div>

        <div className="space-y-4">
          <DistributionCard title="Bölümlere Göre Talebe Dağılımı" items={dashboard.departmentDistribution} />
          <DistributionCard title="Sınıflara Göre Talebe Dağılımı" items={dashboard.classDistribution} />
        </div>
      </section>
    </div>
  );
}

function MetricCard({ metric }: { metric: DashboardMetric }) {
  const Icon = metricIcons[metric.key] ?? Activity;

  return (
    <Card size="sm" className="bg-white">
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[#eaf1f6] text-[#093657]">
          <Icon className="size-4" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">{metric.label}</p>
          <p className="mt-1 text-2xl font-semibold leading-none text-[#093657]">{metric.value.toLocaleString("tr-TR")}</p>
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{metric.description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function RecentStudentRecordsCard({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: Array<{ id: string; href: string; name: string; photoUrl: string | null; meta: string }>;
}) {
  return (
    <Card size="sm">
      <CardHeader className="border-b border-border">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="divide-y divide-border p-0">
        {items.length > 0 ? (
          items.map((item) => (
            <Link key={item.id} href={item.href} className="flex min-h-14 items-center gap-3 px-4 py-3 hover:bg-[#f4f8fc]">
              <StudentAvatar name={item.name} photoUrl={item.photoUrl} />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{item.name}</p>
                <p className="line-clamp-1 text-xs text-muted-foreground">{item.meta}</p>
              </div>
            </Link>
          ))
        ) : (
          <EmptyState text="Henüz kayıt yok." />
        )}
      </CardContent>
    </Card>
  );
}

function DistributionCard({ title, items }: { title: string; items: DashboardDistributionItem[] }) {
  const maxCount = Math.max(...items.map((item) => item.count), 1);

  return (
    <Card size="sm">
      <CardHeader className="border-b border-border">
        <CardTitle>{title}</CardTitle>
        <CardDescription>Aktif ve görünür talebe kayıtlarına göre hesaplanır.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 p-4">
        {items.length > 0 ? (
          items.map((item) => (
            <div key={item.id} className="space-y-2 rounded-md border border-border bg-[#f8fafc] p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-sm font-medium">{item.name}</p>
                <span className="text-sm font-semibold text-[#093657]">{item.count}</span>
              </div>
              <div className="h-2 rounded-full bg-[#eaf1f6]">
                <div className="h-2 rounded-full bg-[#093657]" style={{ width: `${Math.max(4, (item.count / maxCount) * 100)}%` }} />
              </div>
            </div>
          ))
        ) : (
          <EmptyState text="Veri yok." />
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="px-4 py-8 text-center text-sm text-muted-foreground">{text}</div>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(new Date(value));
}
