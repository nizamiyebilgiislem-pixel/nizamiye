import { notFound } from "next/navigation";

import { DepartmentErrorMessage } from "@/components/departments/department-error-message";
import { DepartmentForm } from "@/components/departments/department-form";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import { updateDepartmentAction } from "@/lib/departments/actions";
import { getDepartmentById } from "@/lib/departments/queries";

type EditDepartmentPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function EditDepartmentPage({ params, searchParams }: EditDepartmentPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  await requireRole(["admin", "genel_mudur"]);
  const department = await getDepartmentById(id);

  if (!department) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Bölümler"
        title="Bölüm Düzenle"
        description="Adı değiştirdiğinizde slug otomatik güncellenir. İlişkiler department ID üzerinden korunur."
      />
      <DepartmentErrorMessage error={query.error} />
      <Card>
        <CardHeader>
          <CardTitle>{department.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <DepartmentForm action={updateDepartmentAction} mode="edit" initialValues={department} />
        </CardContent>
      </Card>
    </div>
  );
}
