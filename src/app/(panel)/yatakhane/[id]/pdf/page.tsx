import { notFound, redirect } from "next/navigation";

import { PrintableReportShell } from "@/components/reports/printable-report-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth";
import { getActiveAssignmentsByDormitory, getDormitoryById } from "@/lib/dormitory/queries";
import { logPdfGenerated } from "@/lib/reports/actions";

export default async function DormitoryPdfPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { profile } = await requireAuth();
  const dormitory = await getDormitoryById(id);

  if (!dormitory) notFound();
  if (profile.role === "bolum_muduru" && dormitory.department_id !== profile.department_id) redirect("/yatakhane?error=unauthorized");

  const assignments = await getActiveAssignmentsByDormitory(id);
  const available = Math.max(0, dormitory.capacity - assignments.length);

  await logPdfGenerated(profile, {
    reportType: "dormitory_roster",
    entityType: "dormitory",
    entityId: dormitory.id,
    title: `${dormitory.name} Yatakhane Listesi PDF`,
    description: `${dormitory.name} için ${assignments.length} talebelik yatakhane listesi oluşturuldu.`,
  });

  const sortedAssignments = assignments.slice().sort((left, right) => (left.student?.full_name ?? "").localeCompare(right.student?.full_name ?? "", "tr"));

  return (
    <PrintableReportShell
      title={`${dormitory.name} Yatakhane Listesi`}
      subtitle="Yatakhanede aktif olarak kalan talebelerin güncel listesi."
      backHref={`/yatakhane/${dormitory.id}`}
      meta={<><Badge variant="outline">Bölüm: {dormitory.department?.name ?? "-"}</Badge><Badge variant="outline">Kapasite: {dormitory.capacity}</Badge><Badge variant="outline">Yerleşen: {assignments.length}</Badge><Badge variant="outline">Boş: {available}</Badge></>}
    >
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-[#f8fafc]"><tr className="[&>th]:px-4 [&>th]:py-3 [&>th]:text-left [&>th]:font-medium [&>th]:text-muted-foreground"><th className="w-16">Sıra</th><th>Ad Soyad</th><th>Sınıf</th><th>Yerleşim Tarihi</th></tr></thead>
            <tbody className="divide-y divide-border bg-white">
              {sortedAssignments.length > 0 ? sortedAssignments.map((assignment, index) => (
                <tr key={assignment.id} className="[&>td]:px-4 [&>td]:py-3"><td className="text-muted-foreground">{index + 1}</td><td className="font-medium text-[#093657]">{assignment.student?.full_name ?? "Bilinmeyen talebe"}</td><td className="text-muted-foreground">{assignment.student?.course_class?.name ?? "-"}</td><td className="text-muted-foreground">{formatDate(assignment.start_date)}</td></tr>
              )) : <tr><td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">Bu yatakhanede aktif talebe bulunmuyor.</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </PrintableReportShell>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(new Date(value));
}
