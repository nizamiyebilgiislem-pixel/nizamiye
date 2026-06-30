import { notFound, redirect } from "next/navigation";

import { PrintableReportShell } from "@/components/reports/printable-report-shell";
import { StudentAvatar } from "@/components/students/student-avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireAuth } from "@/lib/auth";
import { canViewStudent } from "@/lib/students/permissions";
import { getStudentById } from "@/lib/students/queries";
import { getInfirmaryRecordsByStudent } from "@/lib/infirmary/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logPdfGenerated } from "@/lib/reports/actions";

export default async function StudentInfirmaryPdfPage({ params }: { params: Promise<{ id: string }> }) {
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

  const records = await getInfirmaryRecordsByStudent(student.id);

  await logPdfGenerated(profile, {
    reportType: "student_infirmary_history",
    entityType: "student",
    entityId: student.id,
    studentId: student.id,
    title: `${student.full_name} Revir PDF`,
    description: `${student.full_name} için revir geçmişi oluşturuldu.`,
  });

  return (
    <PrintableReportShell
      title="Revir Geçmişi"
      subtitle="Talebenin sağlık kayıtları ve tedavi geçmişi."
      backHref={`/talebeler/${student.id}`}
      meta={
        <>
          <Badge variant="outline">Talebe: {student.full_name}</Badge>
          <Badge variant="outline">Kayıt: {records.length}</Badge>
        </>
      }
    >
      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="flex items-start gap-4">
            <StudentAvatar name={student.full_name} photoUrl={student.photo_url} size="lg" previewable />
            <div>
              <h2 className="text-2xl font-semibold text-[#093657]">{student.full_name}</h2>
              <p className="text-sm text-muted-foreground">{student.department?.name ?? "Bölüm yok"} · {student.course_class?.name ?? "Sınıf yok"}</p>
            </div>
          </div>

          <div className="space-y-3">
            {records.length > 0 ? (
              records.map((record) => (
                <div key={record.id} className="rounded-md border border-border bg-[#f8fafc] p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-medium text-[#093657]">{record.record_date}</p>
                    <Badge variant="outline">{record.parent_informed ? "Veli bilgilendirildi" : "Veli bilgilendirilmedi"}</Badge>
                  </div>
                  <div className="mt-2 grid gap-2 md:grid-cols-2">
                    <Line label="Şikayet" value={record.complaint ?? "-"} />
                    <Line label="Tedavi" value={record.treatment ?? "-"} />
                    <Line label="Sevk" value={record.sent_to_hospital ? "Evet" : "Hayır"} />
                    <Line label="Hastane" value={record.hospital_name ?? "-"} />
                    <Line label="İlaç" value={record.medication_given ?? "-"} />
                    <Line label="Not" value={record.note ?? "-"} />
                  </div>
                </div>
              ))
            ) : (
              <EmptyState title="Bu talebe için revir kaydı yok." />
            )}
          </div>
        </CardContent>
      </Card>
    </PrintableReportShell>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-white p-2">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-[#093657]">{value}</p>
    </div>
  );
}
