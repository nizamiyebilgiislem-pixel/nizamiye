import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";

import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { deleteStudentDocumentAction } from "@/lib/documents/actions";

import { DocumentErrorMessage } from "@/components/documents/document-error-message";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth";
import { canEditStudentDocuments, canViewStudentDocuments } from "@/lib/documents/permissions";
import { getDocumentById } from "@/lib/documents/queries";
import { cn } from "@/lib/utils";

type DocumentDetailPageProps = { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> };

export default async function DocumentDetailPage({ params, searchParams }: DocumentDetailPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { profile } = await requireAuth();
  const document = await getDocumentById(id);
  if (!document?.student) notFound();
  if (!canViewStudentDocuments(profile, document.course_class)) redirect("/evraklar?error=unauthorized");
  const editable = canEditStudentDocuments(profile, document.student, document.course_class);
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Evraklar"
        title={document.document_type}
        description={`${document.student.full_name} · ${document.course_class?.name ?? "-"}`}
        actions={<><a href={document.file_url} target="_blank" rel="noreferrer" className={cn(buttonVariants({ variant: "secondary" }))}><ExternalLink className="size-4" aria-hidden="true" />Dosyayı Aç</a>{editable ? <><Link href={`/evraklar/${document.id}/duzenle`} className={cn(buttonVariants())}><Pencil className="size-4" aria-hidden="true" />Düzenle</Link><form action={deleteStudentDocumentAction.bind(null, document.id) as unknown as (formData: FormData) => void}><FormSubmitButton variant="destructive" size="sm"><Trash2 className="mr-1.5 size-4" /> Sil</FormSubmitButton></form></> : null}</>}
      />
      <DocumentErrorMessage error={query.error} />
      <Card><CardHeader><CardTitle>Evrak Detayı</CardTitle></CardHeader><CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <Info label="Talebe" value={document.student.full_name} />
        <Info label="Bölüm" value={document.department?.name} />
        <Info label="Sınıf" value={document.course_class?.name} />
        <Info label="Evrak Türü" value={document.document_type} />
        <Info label="Dosya URL" value={document.file_url} />
        <Info label="Yükleyen" value={document.uploaded_by_profile?.full_name} />
        <Info label="Oluşturulma" value={formatDate(document.created_at)} />
      </CardContent></Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return <div className="rounded-md border border-border bg-background p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 break-all text-sm font-medium">{value || "-"}</p></div>;
}
function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(new Date(value));
}
