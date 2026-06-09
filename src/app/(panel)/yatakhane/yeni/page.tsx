import { createDormitoryAction } from "@/lib/dormitory/actions";
import { getDepartments } from "@/lib/students/queries";
import { requireAuth } from "@/lib/auth";
import { canManageDormitories } from "@/lib/dormitory/permissions";
import { redirect } from "next/navigation";
import { DormitoryForm } from "@/components/dormitory/dormitory-form";

export default async function NewDormitoryPage() {
  const { profile } = await requireAuth();

  if (!canManageDormitories(profile)) {
    redirect("/yatakhane");
  }

  const departments = await getDepartments();

  return (
    <DormitoryForm
      action={createDormitoryAction}
      title="Yeni Yatakhane"
      description="Yeni bir yatakhane oluşturun."
      departments={departments}
    />
  );
}
