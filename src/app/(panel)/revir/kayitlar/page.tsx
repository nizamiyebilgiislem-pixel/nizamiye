import { InfirmaryErrorMessage } from "@/components/infirmary/infirmary-error-message";
import { InfirmaryList } from "@/components/infirmary/infirmary-list";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth";
import { getInfirmaryRecordsForProfile } from "@/lib/infirmary/queries";
import { canManageInfirmary } from "@/lib/module-assignments/permissions";

type RecordsPageProps = { searchParams: Promise<{ q?: string; department?: string; class?: string; from?: string; to?: string; hospital?: string; parent?: string; error?: string }> };

export default async function RecordsPage({ searchParams }: RecordsPageProps) {
  const params = await searchParams;
  const { profile } = await requireAuth();
  const canManage = await canManageInfirmary(profile);
  const { records, departments, classes } = await getInfirmaryRecordsForProfile(profile, {
    search: params.q,
    departmentId: params.department,
    classId: params.class,
    dateFrom: params.from,
    dateTo: params.to,
    sentToHospital: params.hospital,
    parentInformed: params.parent,
  });
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Revir" title="Revir Kayıtları" description="Revir kayıtlarını filtreleyin ve görüntüleyin." />
      <InfirmaryErrorMessage error={params.error} />
      <Card><CardContent className="p-4"><form action="/revir/kayitlar" className="grid gap-3 xl:grid-cols-[1fr_180px_180px_150px_150px_170px_170px_auto]">
        <input name="q" defaultValue={params.q ?? ""} placeholder="Talebe, şikayet, hastane, ilaç" className="h-10 rounded-md border border-input bg-background px-3 text-sm" />
        <select name="department" defaultValue={params.department ?? ""} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="">Tüm bölümler</option>{departments.map((d)=><option key={d.id} value={d.id}>{d.name}</option>)}</select>
        <select name="class" defaultValue={params.class ?? ""} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="">Tüm sınıflar</option>{classes.map((c)=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <input name="from" type="date" defaultValue={params.from ?? ""} className="h-10 rounded-md border border-input bg-background px-3 text-sm" />
        <input name="to" type="date" defaultValue={params.to ?? ""} className="h-10 rounded-md border border-input bg-background px-3 text-sm" />
        <select name="hospital" defaultValue={params.hospital ?? ""} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="">Sevk tümü</option><option value="true">Sevk edildi</option><option value="false">Sevk edilmedi</option></select>
        <select name="parent" defaultValue={params.parent ?? ""} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="">Veli tümü</option><option value="true">Bilgilendirildi</option><option value="false">Bilgilendirilmedi</option></select>
        <Button type="submit">Filtrele</Button>
      </form></CardContent></Card>
      {records.length > 0 ? <InfirmaryList records={records} profile={profile} canManageAll={canManage} /> : <p className="text-sm text-muted-foreground">Revir kaydı bulunamadı.</p>}
    </div>
  );
}
