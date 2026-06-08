import { notFound } from "next/navigation";

import { InfirmaryErrorMessage } from "@/components/infirmary/infirmary-error-message";
import { InfirmaryForm } from "@/components/infirmary/infirmary-form";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { createInfirmaryRecordAction } from "@/lib/infirmary/actions";
import { getStudentById } from "@/lib/students/queries";

type NewStudentInfirmaryPageProps = { params: Promise<{ studentId: string }>; searchParams: Promise<{ error?: string }> };

export default async function NewStudentInfirmaryPage({ params, searchParams }: NewStudentInfirmaryPageProps) {
  const [{ studentId }, query] = await Promise.all([params, searchParams]);
  const student = await getStudentById(studentId);
  if (!student) notFound();
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Revir" title="Yeni Revir Kaydı" description={student.full_name} />
      <InfirmaryErrorMessage error={query.error} />
      <Card><CardContent className="p-5"><InfirmaryForm action={createInfirmaryRecordAction} fixedStudent={student} /></CardContent></Card>
    </div>
  );
}
