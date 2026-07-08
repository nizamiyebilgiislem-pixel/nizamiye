import { notFound, redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { PrintableReportShell } from "@/components/reports/printable-report-shell";
import { StudentProfilePdfSummary } from "@/components/students/student-profile-pdf-summary";
import { requireAuth } from "@/lib/auth";
import { getEvaluationsByStudent } from "@/lib/evaluations/queries";
import { getStudentGradeSummary } from "@/lib/grades/queries";
import { logPdfGenerated } from "@/lib/reports/actions";
import { getStudentById } from "@/lib/students/queries";
import { canViewStudent } from "@/lib/students/permissions";
import { getStudentProfileEntries } from "@/lib/student-profile/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function StudentInfoPdfPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { profile } = await requireAuth();
  const student = await getStudentById(id);

  if (!student) {
    notFound();
  }

  if (profile.role === "veli") {
    const supabase = await createSupabaseServerClient();
    const { data: link } = await supabase
      .from("parent_student_links")
      .select("id")
      .eq("parent_profile_id", profile.id)
      .eq("student_id", student.id)
      .maybeSingle();

    if (!link) {
      redirect("/raporlar?error=unauthorized");
    }
  } else if (!canViewStudent(profile, student.course_class)) {
    redirect("/raporlar?error=unauthorized");
  }

  const [gradeSummary, evaluations, profileEntries] = await Promise.all([
    student.course_class ? getStudentGradeSummary(profile, student) : Promise.resolve(null),
    getEvaluationsByStudent(student.id),
    getStudentProfileEntries(student.id),
  ]);

  await logPdfGenerated(profile, {
    reportType: "student_information_form",
    entityType: "student",
    entityId: student.id,
    studentId: student.id,
    title: `${student.full_name} Profil Ozeti PDF`,
    description: `${student.full_name} icin sade profil ozeti olusturuldu.`,
  });

  return (
    <PrintableReportShell
      title="Talebe Profil Ozeti"
      subtitle="Okul durumu, not ozeti ve kanaat kaydi."
      backHref={`/talebeler/${student.id}`}
      meta={
        <>
          <Badge variant="outline">Durum: {student.status}</Badge>
          <Badge variant="outline">Genel Ortalama: {formatAverage(gradeSummary?.generalAverage ?? null)}</Badge>
          <Badge variant="outline">Not: {profileEntries.notes.length}</Badge>
          <Badge variant="outline">Kanaat: {evaluations.length}</Badge>
        </>
      }
    >
      <StudentProfilePdfSummary
        student={student}
        gradeSummary={gradeSummary}
        evaluations={evaluations}
      />
    </PrintableReportShell>
  );
}

function formatAverage(value: number | null) {
  return value === null ? "-" : value.toFixed(2);
}
