import { notFound, redirect } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { ParentErrorMessage } from "@/components/parents/parent-error-message";
import { ParentForm } from "@/components/parents/parent-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth";
import { updateParentProfileAction } from "@/lib/parents/actions";
import { canEditParentProfile } from "@/lib/parents/permissions";
import { getParentProfileByIdForProfile, getVisibleStudentsForParentManagement } from "@/lib/parents/queries";

type EditParentPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function EditParentPage({ params, searchParams }: EditParentPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { profile } = await requireAuth();
  const target = await getParentProfileByIdForProfile(profile, id);

  if (!target) {
    notFound();
  }

  if (!canEditParentProfile(profile, target.linked_students.length)) {
    redirect(`/veliler/${id}?error=unauthorized`);
  }

  const students = await getVisibleStudentsForParentManagement(profile);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Veliler" title="Veli Düzenle" description="Veli profil bilgilerini güncelleyin." />
      <ParentErrorMessage error={query.error} />
      <Card>
        <CardHeader>
          <CardTitle>{target.full_name}</CardTitle>
        </CardHeader>
        <CardContent>
          <ParentForm action={updateParentProfileAction} mode="edit" students={students} initialValues={target} />
        </CardContent>
      </Card>
    </div>
  );
}
