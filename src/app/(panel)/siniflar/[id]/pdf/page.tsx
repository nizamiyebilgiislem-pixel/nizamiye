import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { PrintableReportShell } from "@/components/reports/printable-report-shell";
import { StudentAvatar } from "@/components/students/student-avatar";
import { StudentStatusBadge } from "@/components/students/student-status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth";
import { canViewClass } from "@/lib/classes/permissions";
import { getClassAnalyticsById } from "@/lib/departments/analytics";
import { logPdfGenerated } from "@/lib/reports/actions";

export default async function ClassPdfPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { profile } = await requireAuth();
  const classRow = await getClassAnalyticsById(profile, id);

  if (!classRow) {
    notFound();
  }

  if (!canViewClass(profile, classRow)) {
    redirect("/raporlar?error=unauthorized");
  }

  await logPdfGenerated(profile, {
    reportType: "class_roster",
    entityType: "class",
    entityId: classRow.id,
    title: `${classRow.name} Sınıf Listesi PDF`,
    description: `${classRow.name} için sınıf listesi oluşturuldu.`,
  });

  return (
    <PrintableReportShell
      title="Sınıf Listesi"
      subtitle="Fotoğraflı talebe listesi ve sınıf özeti."
      backHref={`/siniflar/${classRow.id}`}
      meta={
        <>
          <Badge variant="outline">Bölüm: {classRow.department?.name ?? "-"}</Badge>
          <Badge variant="outline">Sınıf hocası: {classRow.class_teacher?.full_name ?? "Atanmadı"}</Badge>
          <Badge variant="outline">Toplam talebe: {classRow.active_student_count}</Badge>
        </>
      }
    >
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Card>
          <CardContent className="grid gap-3 p-4 md:grid-cols-2">
            <Info label="Sınıf adı" value={classRow.name} />
            <Info label="Bölüm" value={classRow.department?.name ?? "-"} />
            <Info label="Sınıf hocası" value={classRow.class_teacher?.full_name ?? "Atanmadı"} />
            <Info label="Toplam öğrenci" value={classRow.active_student_count} />
            <Info label="Başarı ortalaması" value={formatAverage(classRow.success_average)} />
            <Info label="Program" value={classRow.has_schedule ? "Var" : "Yok"} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-4">
            <h2 className="text-base font-semibold text-[#093657]">Sınıf Hocası</h2>
            <p className="text-sm text-muted-foreground">
              Sınıf hocasına hızlı erişim için detay sayfasını kullanabilirsiniz.
            </p>
            {classRow.class_teacher ? (
              <Link href={`/hocalar/${classRow.class_teacher.id}`} className="text-sm font-medium text-[#093657] hover:underline">
                Hocaya git
              </Link>
            ) : (
              <p className="text-sm text-muted-foreground">Hoca atanmamış.</p>
            )}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-[#f8fafc]">
              <tr className="[&>th]:px-4 [&>th]:py-3 [&>th]:text-left [&>th]:font-medium [&>th]:text-muted-foreground">
                <th>Fotoğraf</th>
                <th>Ad Soyad</th>
                <th>Durum</th>
                <th>Telefon</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              {classRow.students.length > 0 ? (
                classRow.students.map((student) => (
                  <tr key={student.id} className="[&>td]:px-4 [&>td]:py-3">
                    <td>
                      <StudentAvatar name={student.full_name} photoUrl={student.photo_url} />
                    </td>
                    <td className="font-medium text-[#093657]">{student.full_name}</td>
                    <td>
                      <StudentStatusBadge status={student.status} />
                    </td>
                    <td className="text-muted-foreground">{student.guardian_phone ?? student.guardian_phone_2 ?? "-"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-10 text-center text-sm text-muted-foreground" colSpan={4}>
                    Bu sınıfta aktif talebe bulunmuyor.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </PrintableReportShell>
  );
}

function Info({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md border border-border bg-[#f8fafc] p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-[#093657]">{value}</p>
    </div>
  );
}

function formatAverage(value: number | null) {
  return value === null ? "Veri yok" : value.toLocaleString("tr-TR", { maximumFractionDigits: 2 });
}
