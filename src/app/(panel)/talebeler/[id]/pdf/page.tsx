import { notFound, redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { StudentAvatar } from "@/components/students/student-avatar";
import { StatusBadge } from "@/components/students/status-badge";
import { requireAuth } from "@/lib/auth";
import { getActiveTerms } from "@/lib/terms/queries";
import { getStudentById } from "@/lib/students/queries";
import { canViewStudent } from "@/lib/students/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PrintableReportShell } from "@/components/reports/printable-report-shell";
import { logPdfGenerated } from "@/lib/reports/actions";
import { getStudentReportParents } from "@/lib/reports/queries";

export default async function StudentInfoPdfPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { profile } = await requireAuth();
  const student = await getStudentById(id);

  if (!student) {
    notFound();
  }

  if (profile.role === "veli") {
    const supabase = await createSupabaseServerClient();
    const { data: link } = await supabase.from("parent_student_links").select("id").eq("parent_profile_id", profile.id).eq("student_id", student.id).maybeSingle();
    if (!link) {
      redirect("/raporlar?error=unauthorized");
    }
  } else if (!canViewStudent(profile, student.course_class)) {
    redirect("/raporlar?error=unauthorized");
  }

  const [activeTerms, parents] = await Promise.all([getActiveTerms(), getStudentReportParents(student.id)]);
  const activeTerm = activeTerms[0] ?? null;

  await logPdfGenerated(profile, {
    reportType: "student_information_form",
    entityType: "student",
    entityId: student.id,
    studentId: student.id,
    title: `${student.full_name} Bilgi Formu PDF`,
    description: `${student.full_name} için talebe bilgi formu oluşturuldu.`,
  });

  return (
    <PrintableReportShell
      title="Talebe Bilgi Formu"
      subtitle="Fotoğraflı talebe özeti, iletişim ve aile bilgileri."
      backHref={`/talebeler/${student.id}`}
      meta={
        <>
          <Badge variant="outline">Güncel dönem: {activeTerm?.name ?? "-"}</Badge>
          <Badge variant="outline">Durum: {student.status}</Badge>
        </>
      }
    >
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="flex items-start gap-4">
              <StudentAvatar name={student.full_name} photoUrl={student.photo_url} size="lg" previewable />
              <div className="min-w-0">
                <h2 className="truncate text-2xl font-semibold text-[#093657]">{student.full_name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{student.department?.name ?? "Bölüm yok"} · {student.course_class?.name ?? "Sınıf yok"}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusBadge status={student.status} />
                  <Badge variant="outline">Numara: {student.identity_number ?? student.id.slice(0, 8).toUpperCase()}</Badge>
                  <Badge variant="outline">Kayıt: {student.registration_date ?? "-"}</Badge>
                </div>
              </div>
            </div>

            <div className="grid gap-2 text-sm">
              <Row label="Telefon" value={student.guardian_phone ?? student.guardian_phone_2 ?? "-"} />
              <Row label="Adres" value={student.address ?? "-"} />
              <Row label="Memleket" value={student.hometown ?? "-"} />
              <Row label="Okul" value={student.school_name ?? "-"} />
              <Row label="Okul Sınıfı" value={student.school_class ?? "-"} />
              <Row label="Uyruğu" value={student.nationality ?? "-"} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-4">
            <div>
              <h3 className="text-lg font-semibold text-[#093657]">Veli Bilgileri</h3>
              <p className="text-sm text-muted-foreground">Bağlı veli hesapları ve yakınlık dereceleri.</p>
            </div>
            <div className="space-y-3">
              {parents.length > 0 ? (
                parents.map((parent) => (
                  <div key={parent.id} className="rounded-md border border-border bg-[#f8fafc] p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-medium text-[#093657]">{parent.full_name}</p>
                        <p className="text-sm text-muted-foreground">{parent.email ?? parent.phone ?? "İletişim bilgisi yok"}</p>
                      </div>
                      <Badge variant="outline">{parent.relation ?? "Yakınlık yok"}</Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Bu talebeye bağlı veli hesabı yok.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </PrintableReportShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-md border border-border bg-[#f8fafc] p-3">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-[#093657]">{value}</span>
    </div>
  );
}
