import { DepartmentErrorMessage } from "@/components/departments/department-error-message";
import { DepartmentForm } from "@/components/departments/department-form";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import { createDepartmentAction } from "@/lib/departments/actions";

type NewDepartmentPageProps = {
  searchParams: Promise<{ error?: string; errorMessage?: string }>;
};

export default async function NewDepartmentPage({ searchParams }: NewDepartmentPageProps) {
  const params = await searchParams;
  await requireRole(["admin", "genel_mudur"]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Bölümler"
        title="Yeni Bölüm"
        description="Bölüm adı girildiğinde slug otomatik oluşturulur. Bölüm ilişkileri korunur; silme yoktur."
      />
      <DepartmentErrorMessage error={params.error} errorMessage={params.errorMessage} />
      <Card>
        <CardHeader>
          <CardTitle>Bölüm Bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <DepartmentForm action={createDepartmentAction} mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}
