import { notFound, redirect } from "next/navigation";

import { DormitoryForm } from "@/components/dormitory/dormitory-form";
import { requireAuth } from "@/lib/auth";
import { canManageDormitories } from "@/lib/dormitory/permissions";
import { getDormitoryById } from "@/lib/dormitory/queries";
import { getDepartments } from "@/lib/students/queries";
import { updateDormitoryAction } from "@/lib/dormitory/actions";

type EditDormitoryPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditDormitoryPage({ params }: EditDormitoryPageProps) {
  const { id } = await params;
  const { profile } = await requireAuth();

  if (!canManageDormitories(profile)) {
    redirect("/yatakhane");
  }

  const dormitory = await getDormitoryById(id);

  if (!dormitory) {
    notFound();
  }

  const departments = await getDepartments();

  return (
    <DormitoryForm
      action={updateDormitoryAction}
      title="Yatakhane Düzenle"
      description="Yatakhane bilgilerini güncelleyin."
      dormitory={dormitory}
      departments={departments}
    />
  );
}
