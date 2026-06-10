import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Pencil } from "lucide-react";

import { InfirmaryErrorMessage } from "@/components/infirmary/infirmary-error-message";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth";
import { canEditInfirmaryRecord, canViewInfirmaryRecords } from "@/lib/infirmary/permissions";
import { getInfirmaryRecordById } from "@/lib/infirmary/queries";
import { canManageInfirmary } from "@/lib/module-assignments/permissions";
import { cn } from "@/lib/utils";

type InfirmaryDetailPageProps = { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> };

export default async function InfirmaryDetailPage({ params, searchParams }: InfirmaryDetailPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { profile } = await requireAuth();
  const record = await getInfirmaryRecordById(id);
  if (!record?.student) notFound();
  if (!canViewInfirmaryRecords(profile, record.course_class) && !(await canManageInfirmary(profile))) redirect("/revir/kayitlar?error=unauthorized");
  const editable = canEditInfirmaryRecord(profile, record.student, record.course_class) || await canManageInfirmary(profile);
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <PageHeader eyebrow="Revir" title={record.student.full_name} description={`${record.department?.name ?? "-"} · ${record.course_class?.name ?? "-"}`} />
        {editable ? <Link href={`/revir/${record.id}/duzenle`} className={cn(buttonVariants())}><Pencil className="size-4" aria-hidden="true" />Düzenle</Link> : null}
      </div>
      <InfirmaryErrorMessage error={query.error} />
      <Card><CardHeader><CardTitle>Revir Kaydı</CardTitle></CardHeader><CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <Info label="Tarih" value={record.record_date} />
        <Info label="Şikayet" value={record.complaint} />
        <Info label="Tedavi" value={record.treatment} />
        <Info label="Hastaneye Sevk" value={record.sent_to_hospital ? "Evet" : "Hayır"} />
        <Info label="Hastane Adı" value={record.hospital_name} />
        <Info label="İlaç" value={record.medication_given} />
        <Info label="Veli Bilgilendirildi" value={record.parent_informed ? "Evet" : "Hayır"} />
        <Info label="Not" value={record.note} />
        <Info label="Kaydı Giren" value={record.created_by_profile?.full_name} />
        <Info label="Oluşturulma" value={formatDate(record.created_at)} />
      </CardContent></Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return <div className="rounded-md border border-border bg-background p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-sm font-medium">{value || "-"}</p></div>;
}
function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(new Date(value));
}
