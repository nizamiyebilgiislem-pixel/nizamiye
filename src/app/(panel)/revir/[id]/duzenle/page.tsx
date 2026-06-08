import { notFound, redirect } from "next/navigation";

import { InfirmaryErrorMessage } from "@/components/infirmary/infirmary-error-message";
import { InfirmaryForm } from "@/components/infirmary/infirmary-form";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth";
import { updateInfirmaryRecordAction } from "@/lib/infirmary/actions";
import { canEditInfirmaryRecord } from "@/lib/infirmary/permissions";
import { getInfirmaryRecordById } from "@/lib/infirmary/queries";

type EditInfirmaryPageProps = { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> };

export default async function EditInfirmaryPage({ params, searchParams }: EditInfirmaryPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { profile } = await requireAuth();
  const record = await getInfirmaryRecordById(id);
  if (!record?.student) notFound();
  if (!canEditInfirmaryRecord(profile, record.student, record.course_class)) redirect(`/revir/${id}?error=unauthorized`);
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Revir" title="Revir Kaydı Düzenle" description={record.student.full_name} />
      <InfirmaryErrorMessage error={query.error} />
      <Card><CardContent className="p-5"><InfirmaryForm action={updateInfirmaryRecordAction} record={record} /></CardContent></Card>
    </div>
  );
}
