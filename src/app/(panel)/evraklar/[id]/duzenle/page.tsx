import { notFound, redirect } from "next/navigation";

import { DocumentErrorMessage } from "@/components/documents/document-error-message";
import { DocumentForm } from "@/components/documents/document-form";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth";
import { updateDocumentAction } from "@/lib/documents/actions";
import { canEditStudentDocuments } from "@/lib/documents/permissions";
import { getDocumentById } from "@/lib/documents/queries";

type EditDocumentPageProps = { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> };

export default async function EditDocumentPage({ params, searchParams }: EditDocumentPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { profile } = await requireAuth();
  const document = await getDocumentById(id);
  if (!document?.student) notFound();
  if (!canEditStudentDocuments(profile, document.student, document.course_class)) redirect(`/evraklar/${id}?error=unauthorized`);
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Evraklar" title="Evrak Düzenle" description={document.student.full_name} />
      <DocumentErrorMessage error={query.error} />
      <Card><CardContent className="p-5"><DocumentForm action={updateDocumentAction} document={document} /></CardContent></Card>
    </div>
  );
}
