import { DocumentErrorMessage } from "@/components/documents/document-error-message";
import { DocumentCreateForm } from "@/components/documents/document-create-form";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth";
import { createDocumentAction } from "@/lib/documents/actions";
import { getDocumentCreateOptions } from "@/lib/documents/queries";

type NewDocumentPageProps = { searchParams: Promise<{ error?: string }> };

export default async function NewDocumentPage({ searchParams }: NewDocumentPageProps) {
  const params = await searchParams;
  const { profile } = await requireAuth();

  if (profile.role === "destek_birim_muduru") {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Evraklar" title="Yeni Evrak" description="Yetkisiz erişim" />
        <Card><CardContent className="p-5 text-center text-sm text-muted-foreground">Bu işlem için yetkiniz bulunmamaktadır.</CardContent></Card>
      </div>
    );
  }

  const options = await getDocumentCreateOptions(profile);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Evraklar" title="Yeni Evrak" description="Talebe seçerek manuel dosya URL evrak kaydı oluşturun." />
      <DocumentErrorMessage error={params.error} />
      <Card>
        <CardContent className="p-5">
          <DocumentCreateForm options={options} action={createDocumentAction} />
        </CardContent>
      </Card>
    </div>
  );
}