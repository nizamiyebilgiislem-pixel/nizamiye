import Link from "next/link";
import { Activity, Building2, GraduationCap, School, UsersRound } from "lucide-react";

import {
  SuspenseAttendanceCard,
  SuspenseDepartmentSection,
  SuspenseDormitoryCard,
  SuspenseDutyCard,
  SuspenseGuidanceCard,
  SuspenseLibraryCard,
  SuspenseLiveSessionCard,
  SuspenseTaskCard,
  SuspenseTodayLessonLogsCard,
} from "@/components/dashboard/async-widgets";
import { MetricCard } from "@/components/dashboard/metric-card";
import { PageHeader } from "@/components/layout/page-header";
import { ReportShortcutCard } from "@/components/reports/report-shortcut-card";
import { StudentAvatar } from "@/components/students/student-avatar";
import { StudentStatusBadge } from "@/components/students/student-status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getDashboardData, type DashboardDistributionItem } from "@/lib/dashboard/queries";
import { getActiveTerms } from "@/lib/terms/queries";

import type { ProfileRow } from "@/types/database";

const metricIcons: Record<string, typeof GraduationCap> = {
  "active-students": GraduationCap,
  teachers: UsersRound,
  "active-classes": School,
  "active-departments": Building2,
};

export async function AdminDashboard({ profile }: { profile: ProfileRow }) {
  const [dashboard, activeTerms] = await Promise.all([
    getDashboardData(profile),
    getActiveTerms(),
  ]);
  const activeTerm = activeTerms[0] ?? null;
  const mainMetricKeys = new Set(["active-students", "teachers", "active-classes", "active-departments"]);


  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Yönetim"
        title="Yönetim Paneli"
        description="Bölüm durumu, doluluk, başarı ve operasyon kayıtlarını tek ekranda izleyin."
      />

      <Card className="border-[#093657]/10 bg-white">
        <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#eaf1f6]">
              <Activity className="size-5 text-[#093657]" aria-hidden />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Aktif Dönem</p>
              <p className="mt-0.5 text-lg font-semibold text-[#093657]">{activeTerm?.name ?? "Aktif dönem tanımlı değil"}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {activeTerm ? "Not ve başarı panelleri bu dönem verilerine göre hesaplanır." : "Not ve başarı panelleri için aktif dönem tanımlanmalıdır."}
          </p>
        </CardContent>
      </Card>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-[#093657]">Bölümlerin Güncel Durumu</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {dashboard.metrics.filter((metric) => mainMetricKeys.has(metric.key)).map((metric) => {
            const Icon = metricIcons[metric.key] ?? Activity;
            return <MetricCard key={metric.key} icon={Icon} label={metric.label} value={metric.value} />;
          })}
        </div>
      </section>

      <SuspenseDepartmentSection profile={profile} activeTermName={activeTerm?.name} />

      <SuspenseAttendanceCard profile={profile} />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SuspenseDormitoryCard profile={profile} />
        <SuspenseLibraryCard />
        <SuspenseGuidanceCard profile={profile} />
        <SuspenseDutyCard />
        <SuspenseTaskCard profile={profile} />
        <SuspenseLiveSessionCard profile={profile} />
        <SuspenseTodayLessonLogsCard maxItems={5} />
        <div className="space-y-3">
          <ReportShortcutCard
            title="PDF Merkezi"
            description="Talebe, sınıf, bölüm ve dönem raporlarına hızlı erişim."
            href="/raporlar"
            badge={
              <span className="inline-flex items-center rounded-md bg-[#eaf1f6] px-2 py-0.5 text-xs font-medium text-[#093657]">
                Hızlı erişim
              </span>
            }
          />
          <ReportShortcutCard
            title="Raporlar Merkezi"
            description="Genel rapor merkezi ve resmi çıktılar."
            href="/raporlar"
            badge={
              <span className="inline-flex items-center rounded-md bg-[#eaf1f6] px-2 py-0.5 text-xs font-medium text-[#093657]">
                Merkez
              </span>
            }
          />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="bg-white xl:col-span-2">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-base">Son Eklenen Talebeler</CardTitle>
            <CardDescription>Yetki alanınızdaki en yeni talebe kayıtları.</CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-border p-0">
            {dashboard.latestStudents.length > 0 ? (
              dashboard.latestStudents.map((student) => (
                <Link key={student.id} href={`/talebeler/${student.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-[#f8fafc]">
                  <StudentAvatar name={student.full_name} photoUrl={student.photo_url} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#0f172a]">{student.full_name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {student.department?.name ?? "Bölüm yok"} · {student.course_class?.name ?? "Sınıf yok"}
                    </p>
                  </div>
                  <StudentStatusBadge status={student.status} />
                </Link>
              ))
            ) : (
              <EmptyState title="Henüz kayıt yok." />
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <DistributionCard title="Bölümlere Göre Dağılım" items={dashboard.departmentDistribution} />
          <DistributionCard title="Sınıflara Göre Dağılım" items={dashboard.classDistribution} />
        </div>
      </div>

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
    <Card className="bg-white">
      <CardHeader className="border-b border-border pb-3">
        <CardTitle className="text-sm">{title}</CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent className="divide-y divide-border p-0">
        {items.length > 0 ? (
          items.map((item) => (
            <Link key={item.id} href={item.href} className="flex min-h-[52px] items-center gap-3 px-4 py-3 hover:bg-[#f8fafc]">
              <StudentAvatar name={item.name} photoUrl={item.photoUrl} />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[#0f172a]">{item.name}</p>
                <p className="line-clamp-1 text-xs text-muted-foreground">{item.meta}</p>
              </div>
            </Link>
          ))
        ) : (
          <EmptyState title="Henüz kayıt yok." />
        )}
      </CardContent>
    </Card>
  );
}

function DistributionCard({ title, items }: { title: string; items: DashboardDistributionItem[] }) {
  const maxCount = Math.max(...items.map((item) => item.count), 1);

  return (
    <Card className="bg-white">
      <CardHeader className="border-b border-border pb-3">
        <CardTitle className="text-sm">{title}</CardTitle>
        <CardDescription className="text-xs">Aktif talebe kayıtlarına göre.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2.5 p-4">
        {items.length > 0 ? (
          items.map((item) => (
            <Link
              key={item.id}
              href={title === "Sınıflara Göre Dağılım" ? `/siniflar/${item.id}` : `/bolumler/${item.id}`}
              className="block space-y-1.5 rounded-lg border border-[#e5e7eb] bg-[#f8fafc] p-2.5 transition-colors hover:bg-[#eaf1f6]"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-xs font-medium text-[#0f172a]">{item.name}</p>
                <span className="text-sm font-semibold text-[#093657]">{item.count}</span>
              </div>
              <div className="h-1.5 rounded-full bg-[#eaf1f6]">
                <div className="h-1.5 rounded-full bg-[#093657]" style={{ width: `${Math.max(4, (item.count / maxCount) * 100)}%` }} />
              </div>
            </Link>
          ))
        ) : (
          <EmptyState title="Veri yok." />
        )}
      </CardContent>
    </Card>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(new Date(value));
}
