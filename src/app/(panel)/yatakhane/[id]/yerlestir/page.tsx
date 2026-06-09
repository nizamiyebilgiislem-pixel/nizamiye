import { notFound, redirect } from "next/navigation";

import { AssignStudentForm } from "@/components/dormitory/assign-student-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth";
import { canManageDormitoryAssignments } from "@/lib/dormitory/permissions";
import { getDormitoryById, getDormitoryAssignmentCount } from "@/lib/dormitory/queries";
import { assignStudentAction } from "@/lib/dormitory/actions";

type AssignStudentPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AssignStudentPage({ params }: AssignStudentPageProps) {
  const { id } = await params;
  const { profile } = await requireAuth();

  if (!canManageDormitoryAssignments(profile)) {
    redirect(`/yatakhane/${id}`);
  }

  const dormitory = await getDormitoryById(id);

  if (!dormitory) {
    notFound();
  }

  const assignedCount = await getDormitoryAssignmentCount(id);

  if (assignedCount >= dormitory.capacity) {
    redirect(`/yatakhane/${id}?error=capacity-full`);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Öğrenci Yerleştir</CardTitle>
          <CardDescription>
            {dormitory.name} &middot; Kapasite: {dormitory.capacity} &middot; Dolu: {assignedCount}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AssignStudentForm dormitoryId={id} action={assignStudentAction} />
        </CardContent>
      </Card>
    </div>
  );
}
