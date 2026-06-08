import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { ReportShortcutCard } from "@/components/reports/report-shortcut-card";
import { StudentAvatar } from "@/components/students/student-avatar";
import { StudentStatusBadge } from "@/components/students/student-status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth";
import { getReportStudentsForProfile } from "@/lib/reports/queries";
import { cn } from "@/lib/utils";

export default async function StudentReportsPage() {
  const { profile } = await requireAuth();
  const students = await getReportStudentsForProfile(profile);
  const isParent = profile.role === "veli";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="PDF Merkezi"
        title="Talebe Raporları"
        description={isParent ? "Bağlı talebeleriniz için bireysel PDF çıktıları." : "Yetki kapsamınızdaki talebeler için resmi PDF çıktıları."}
      />

      <Card size="sm" className="border-[#093657]/15 bg-white">
        <CardContent className="flex flex-col gap-2 p-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Kapsam</p>
            <p className="text-sm font-medium text-[#093657]">{isParent ? "Veli hesabı" : `${students.length} talebe`}</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Her talebe kartı üzerinden bilgi formu, not, kanaat ve revir PDF&apos;lerine ulaşabilirsiniz.
          </p>
        </CardContent>
      </Card>

      {students.length > 0 ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {students.map((student) => (
            <Card key={student.id} className="bg-white">
              <CardContent className="space-y-4 p-4">
                <div className="flex items-start gap-3">
                  <StudentAvatar name={student.full_name} photoUrl={student.photo_url} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-base font-semibold text-[#093657]">{student.full_name}</h2>
                      <StudentStatusBadge status={student.status} />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {student.department?.name ?? "Bölüm yok"} · {student.course_class?.name ?? "Sınıf yok"}
                    </p>
                    {student.relation ? <Badge variant="outline">{student.relation}</Badge> : null}
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <ReportLink href={`/talebeler/${student.id}/pdf`} label="Bilgi Formu PDF" />
                  <ReportLink href={`/talebeler/${student.id}/notlar/pdf`} label="Not Dökümü PDF" />
                  <ReportLink href={`/talebeler/${student.id}/kanaat/pdf`} label="Kanaat PDF" />
                  <ReportLink href={`/talebeler/${student.id}/revir/pdf`} label="Revir PDF" />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link href={`/talebeler/${student.id}`} className={cn("text-sm font-medium text-[#093657] hover:underline")}>
                    Talebe detayına git
                  </Link>
                  <span className="text-sm text-muted-foreground">·</span>
                  <span className="text-sm text-muted-foreground">{student.identity_number ?? "Numara yok"}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <ReportShortcutCard
          title="Talebe bulunamadı"
          description={isParent ? "Bağlı talebe hesabı bulunmuyor." : "Yetki kapsamınızda talebe bulunmuyor."}
          href="/raporlar"
          badge="Boş"
        />
      )}
    </div>
  );
}

function ReportLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center justify-center rounded-md border border-[#093657]/15 bg-[#f8fafc] px-3 py-2 text-sm font-medium text-[#093657] transition-colors hover:bg-[#eef4f8]"
    >
      {label}
    </Link>
  );
}
