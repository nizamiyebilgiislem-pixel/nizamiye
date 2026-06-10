import { notFound } from "next/navigation";

import { InfirmaryErrorMessage } from "@/components/infirmary/infirmary-error-message";
import { InfirmaryForm } from "@/components/infirmary/infirmary-form";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth";
import { createInfirmaryRecordAction } from "@/lib/infirmary/actions";
import { canManageInfirmary } from "@/lib/module-assignments/permissions";
import { getStudentById } from "@/lib/students/queries";

type NewStudentInfirmaryPageProps = { params: Promise<{ studentId: string }>; searchParams: Promise<{ error?: string }> };

export default async function NewStudentInfirmaryPage({ params, searchParams }: NewStudentInfirmaryPageProps) {
  const [{ studentId }, query] = await Promise.all([params, searchParams]);
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