import Link from "next/link";
import { AlertTriangle, BookOpen, CheckCircle2, ClipboardList, FileText, GraduationCap, School, Users } from "lucide-react";

import { StudentAvatar } from "@/components/students/student-avatar";
import { StudentStatusBadge } from "@/components/students/student-status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { getAttendanceDashboardSummary } from "@/lib/attendance/queries";
import { getActiveTerms } from "@/lib/terms/queries";
import type { ProfileRow } from "@/types/database";

import { getClassTeacherDashboardData } from "@/lib/dashboard/role-based-queries";

export async function ClassTeacherDashboard({ profile }: { profile: ProfileRow }) {
  const [data, activeTerms] = await Promise.all([
    getClassTeacherDashboardData(profile),
    getActiveTerms(),
  ]);

  const activeTerm = activeTerms[0] ?? null;

  if (data.classes.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Sınıf Hocası"
          title="Dashboard"
          description="Sınıfınızın güncel durumunu izleyin."
        />
        <Card className="border-[#093657]/10 bg-white">
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <School className="size-12 text-muted-foreground" aria-hidden />
            <div className="space-y-1 text-center">
              <p className="text-lg font-semibold text-[#093657]">Size atanmış sınıf bulunmuyor</p>
              <p className="text-sm text-muted-foreground">Henüz bir sınıfa sınıf hocası olarak atanmadınız.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const primaryClass = data.classes[0];
  const totalStudents = data.classes.reduce((sum, c) => sum + c.active_student_count, 0);
  const totalMissingEvaluation = data.classes.reduce((sum, c) => sum + c.missing_evaluation_count, 0);
  const missingAttendanceClasses = data.classes.filter((c) => !c.today_attendance_taken);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={primaryClass.department_name ?? "Sınıf"}
        title={data.classes.length > 1 ? "Sınıflarım" : primaryClass.name}
        description={
          data.classes.length > 1
            ? `${data.classes.length} sınıfınız bulunuyor.`
            : `${totalStudents} talebe ile eğitime devam ediyorsunuz.`
        }
      />

      {activeTerm ? (
        <Card className="border-[#093657]/10 bg-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#eaf1f6]">
                <GraduationCap className="size-5 text-[#093657]" aria-hidden />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Aktif Dönem</p>
                <p className="text-lg font-semibold text-[#093657]">{activeTerm.name}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStatCard icon={Users} label="Toplam Talebe" value={totalStudents} />
        <MiniStatCard icon={School} label={data.classes.length > 1 ? "Sınıf Sayısı" : "Sınıf"} value={data.classes.length} />
        <MiniStatCard icon={ClipboardList} label="Kanaat Eksik" value={totalMissingEvaluation} />
        <MiniStatCard
          icon={BookOpen}
          label="Ders Programı"
          value={data.classes.filter((c) => c.has_schedule).length}
        />
      </div>

      {missingAttendanceClasses.length > 0 ? (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-start gap-3 p-4">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-amber-900">Bugünkü Yoklama Bekliyor</p>
              <p className="text-sm text-amber-800">
                {missingAttendanceClasses.map((c) => c.name).join(", ")} — Bugün için henüz günlük yoklama alınmamış.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : totalStudents > 0 ? (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="flex items-start gap-3 p-4">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" aria-hidden />
            <p className="text-sm font-semibold text-emerald-900">Tüm sınıfların bugünkü yoklaması alınmış.</p>
          </CardContent>
        </Card>
      ) : null}

      <AttendanceSummaryCard profile={profile} />

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-[#093657]">Sınıflar</h2>
            <p className="text-xs text-muted-foreground">Size ait sınıflar ve durum özeti.</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {data.classes.map((classRow) => (
            <Link key={classRow.id} href={`/siniflar/${classRow.id}`} className="block">
              <Card className="border-[#093657]/10 bg-white transition-colors hover:bg-[#f8fafc]">
                <CardHeader className="border-b border-border pb-2">
                  <CardTitle className="truncate text-base">{classRow.name}</CardTitle>
                  <CardDescription className="truncate text-xs">
                    {classRow.department_name ?? "Bölüm yok"} · {classRow.active_student_count} talebe
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-4 p-3 pt-2">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className={classRow.today_attendance_taken ? "text-emerald-600" : "text-amber-600"}>
                      {classRow.today_attendance_taken ? "Yoklama alındı" : "Yoklama alınmadı"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ClipboardList className="size-3.5" aria-hidden />
                    <span>{classRow.missing_evaluation_count} kanaat eksik</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {data.students.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-[#093657]">Sınıfımdaki Talebeler</h2>
          <Card className="bg-white">
            <CardContent className="divide-y divide-border p-0">
              {data.students.slice(0, 10).map((student) => (
                <Link key={student.id} href={`/talebeler/${student.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-[#f8fafc]">
                  <StudentAvatar name={student.full_name} photoUrl={student.photo_url} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#0f172a]">{student.full_name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {student.department_name ?? ""}
                    </p>
                  </div>
                  <StudentStatusBadge status={student.status} />
                </Link>
              ))}
            </CardContent>
          </Card>
        </section>
      ) : null}

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-[#093657]">Hızlı İşlemler</h2>
        <div className="flex flex-wrap gap-2">
          <QuickActionButton href="/yoklama/yeni" label="Günlük Yoklama Al" />
          <QuickActionButton href="/kanaat-sistemi/kanaat-girisi" label="Kanaat Gir" />
          <QuickActionButton
            href={`/egitim-planlama/ders-atamalari/${primaryClass.id}`}
            label="Sınıf Dersleri"
          />
          <QuickActionButton
            href={`/egitim-planlama/ders-programi/${primaryClass.id}`}
            label="Ders Programı"
          />
          <QuickActionButton href="/talepler/yeni" label="Talep Oluştur" />
        </div>
      </section>
    </div>
  );
}

async function AttendanceSummaryCard({ profile }: { profile: ProfileRow }) {
  const summary = await getAttendanceDashboardSummary(profile);

  if (summary.daily.takenClassCount === 0 && summary.daily.missingClassCount === 0) {
    return null;
  }

  return (
    <Card className="bg-white">
      <CardHeader className="border-b border-border pb-2">
        <CardTitle className="text-sm">Bugünkü Yoklama Durumu</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 p-3 md:grid-cols-2">
        <div className="rounded-md border border-border bg-[#f8fafc] p-3">
          <p className="mb-2 text-xs font-medium text-[#093657]">Günlük Yoklama</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <span className="text-muted-foreground">Alınan: <strong>{summary.daily.takenClassCount}</strong></span>
            <span className="text-muted-foreground">Alınmayan: <strong>{summary.daily.missingClassCount}</strong></span>
            <span className="text-muted-foreground">Katılan: <strong>{summary.daily.presentCount}</strong></span>
            <span className="text-muted-foreground">Katılmayan: <strong>{summary.daily.absentCount}</strong></span>
          </div>
        </div>
        <div className="rounded-md border border-border bg-[#f8fafc] p-3">
          <p className="mb-2 text-xs font-medium text-[#093657]">Namaz Yoklaması</p>
          <div className="space-y-1 text-xs">
            {summary.prayers.slice(0, 3).map((prayer) => (
              <div key={prayer.type} className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">{prayer.label}</span>
                <span>
                  {prayer.takenClassCount} alınan / {prayer.missingClassCount} eksik
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MiniStatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: number;
}) {
  return (
    <Card className="border-[#e5e7eb] bg-white">
      <CardContent className="flex items-center gap-2.5 p-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-[#eaf1f6]">
          <Icon className="size-4 text-[#093657]" aria-hidden />
        </div>
        <div className="flex flex-1 items-center justify-between gap-2">
          <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
          <p className="text-sm font-semibold text-[#093657]">{value.toLocaleString("tr-TR")}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickActionButton({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-md border border-[#093657]/20 bg-white px-3 py-2 text-xs font-medium text-[#093657] transition-colors hover:bg-[#eaf1f6]"
    >
      <FileText className="size-3.5" aria-hidden />
      {label}
    </Link>
  );
}
