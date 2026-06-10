import { InfirmaryErrorMessage } from "@/components/infirmary/infirmary-error-message";
import { InfirmaryForm } from "@/components/infirmary/infirmary-form";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth";
import { createInfirmaryRecordAction } from "@/lib/infirmary/actions";
import { getInfirmaryEntryOptions } from "@/lib/infirmary/queries";
import { canManageInfirmary } from "@/lib/module-assignments/permissions";

type NewInfirmaryPageProps = { searchParams: Promise<{ department?: string; class?: string; error?: string }> };

export default async function NewInfirmaryPage({ searchParams }: NewInfirmaryPageProps) {
  const params = await searchParams;
  const { profile } = await requireAuth();
  const canManage = await canManageInfirmary(profile);

  if (!canManage) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Revir" title="Yeni Revir Kaydı" description="Yetkisiz erişim" />
        <Card><CardContent className="p-5 text-center text-sm text-muted-foreground">Bu işlem için yetkiniz bulunmamaktadır.</CardContent></Card>
      </div>
    );
  }

  const { departments, classes, selectedClass, students } = await getInfirmaryEntryOptions(profile, { departmentId: params.department, classId: params.class });
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Revir" title="Yeni Revir Kaydı" description="Talebe seçerek revir kaydı oluşturun." />
      <InfirmaryErrorMessage error={params.error} />
      <Card><CardContent className="p-4"><form action="/revir/yeni" className="grid gap-3 md:grid-cols-[220px_220px_auto]">
        <select name="department" defaultValue={params.department ?? selectedClass?.department_id ?? ""} className="h-10 rounded-md border border-input bg-background px-3 text-sm">{departments.map((d)=><option key={d.id} value={d.id}>{d.name}</option>)}</select>
        <select name="class" defaultValue={selectedClass?.id ?? ""} className="h-10 rounded-md border border-input bg-background px-3 text-sm">{classes.map((c)=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <button type="submit" className="h-10 rounded-md bg-secondary px-4 text-sm font-medium">Öğrencileri Göster</button>
      </form></CardContent></Card>
      <Card><CardContent className="p-5"><InfirmaryForm action={createInfirmaryRecordAction} students={students} /></CardContent></Card>
    </div>
  );
}