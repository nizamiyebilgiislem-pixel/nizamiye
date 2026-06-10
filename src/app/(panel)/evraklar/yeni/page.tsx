import { DocumentErrorMessage } from "@/components/documents/document-error-message";
import { DocumentForm } from "@/components/documents/document-form";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth";
import { createDocumentAction } from "@/lib/documents/actions";
import { getDocumentEntryOptions } from "@/lib/documents/queries";

type NewDocumentPageProps = { searchParams: Promise<{ department?: string; class?: string; error?: string }> };

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

  const { departments, classes, selectedClass, students } = await getDocumentEntryOptions(profile, { departmentId: params.department, classId: params.class });
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Evraklar" title="Yeni Evrak" description="Talebe seçerek manuel dosya URL evrak kaydı oluşturun." />
      <DocumentErrorMessage error={params.error} />
      <Card><CardContent className="p-4"><form action="/evraklar/yeni" className="grid gap-3 md:grid-cols-[220px_220px_auto]">
        <select name="department" defaultValue={params.department ?? selectedClass?.department_id ?? ""} className="h-10 rounded-md border border-input bg-background px-3 text-sm">{departments.map((d)=><option key={d.id} value={d.id}>{d.name}</option>)}</select>
        <select name="class" defaultValue={selectedClass?.id ?? ""} className="h-10 rounded-md border border-input bg-background px-3 text-sm">{classes.map((c)=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <button type="submit" className="h-10 rounded-md bg-secondary px-4 text-sm font-medium">Öğrencileri Göster</button>
      </form></CardContent></Card>
      <Card><CardContent className="p-5"><DocumentForm action={createDocumentAction} students={students} /></CardContent></Card>
    </div>
  );
}