import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { PageHeader } from "@/components/layout/page-header";
import { ParentErrorMessage } from "@/components/parents/parent-error-message";
import { ParentForm } from "@/components/parents/parent-form";
import { createParentProfileAction } from "@/lib/parents/actions";
import { canCreateParentProfile } from "@/lib/parents/permissions";
import { getVisibleStudentsForParentManagement } from "@/lib/parents/queries";
import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";

type NewParentPageProps = {
  searchParams: Promise<{ error?: string; studentId?: string }>;
};

export default async function NewParentPage({ searchParams }: NewParentPageProps) {
  const params = await searchParams;
  const { profile } = await requireAuth();

  if (!canCreateParentProfile(profile)) {
    redirect("/veliler?error=unauthorized");
  }

  const students = await getVisibleStudentsForParentManagement(profile);
  const initialStudentIds = params.studentId ? [params.studentId] : [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Veliler"
        title="Yeni Veli"
        description="Veli profili oluşturun, isterseniz aynı anda Auth hesabı açın ve talebelerle bağlayın."
      />
      <ParentErrorMessage error={params.error} />
      <Card>
        <CardHeader>
          <CardTitle>Veli Bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <ParentForm
            action={createParentProfileAction}
            mode="create"
            students={students}
            initialStudentIds={initialStudentIds}
          />
        </CardContent>
      </Card>
    </div>
  );
}
