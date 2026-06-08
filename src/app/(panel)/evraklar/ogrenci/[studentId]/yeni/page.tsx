import { notFound } from "next/navigation";

import { DocumentErrorMessage } from "@/components/documents/document-error-message";
import { DocumentForm } from "@/components/documents/document-form";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { createDocumentAction } from "@/lib/documents/actions";
import { getStudentById } from "@/lib/students/queries";

type NewStudentDocumentPageProps = { params: Promise<{ studentId: string }>; searchParams: Promise<{ error?: string }> };

export default async function NewStudentDocumentPage({ params, searchParams }: NewStudentDocumentPageProps) {
  const [{ studentId }, query] = await Promise.all([params, searchParams]);
  const student = await getStudentById(studentId);
  if (!student) notFound();
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Evraklar" title="Yeni Evrak" description={student.full_name} />
      <DocumentErrorMessage error={query.error} />
      <Card><CardContent className="p-5"><DocumentForm action={createDocumentAction} fixedStudent={student} /></CardContent></Card>
    </div>
  );
}
