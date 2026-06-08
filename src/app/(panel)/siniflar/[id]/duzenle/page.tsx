import { notFound, redirect } from "next/navigation";

import { ClassErrorMessage } from "@/components/classes/class-error-message";
import { ClassForm } from "@/components/classes/class-form";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth";
import { updateClassAction } from "@/lib/classes/actions";
import { canEditClass } from "@/lib/classes/permissions";
import { getClassById, getDepartmentsForProfile, getTeachersByDepartment } from "@/lib/classes/queries";

type EditClassPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function EditClassPage({ params, searchParams }: EditClassPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { profile } = await requireAuth();
  const classRow = await getClassById(id);

  if (!classRow) {
    notFound();
  }

  if (!canEditClass(profile, classRow)) {
    redirect(`/siniflar/${id}?error=unauthorized`);
  }

  const [departments, teachers] = await Promise.all([
    getDepartmentsForProfile(profile),
    getTeachersByDepartment(classRow.department_id),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Sınıflar"
        title="Sınıf Düzenle"
        description="Sınıf adını, sınıf hocasını ve aktiflik durumunu güncelleyin. Bölüm bu fazda değiştirilemez."
      />
      <ClassErrorMessage error={query.error} />
      <Card>
        <CardHeader>
          <CardTitle>{classRow.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <ClassForm
            action={updateClassAction}
            departments={departments}
            teachers={teachers}
            profile={profile}
            mode="edit"
            initialValues={{
              id: classRow.id,
              department_id: classRow.department_id,
              name: classRow.name,
              class_teacher_id: classRow.class_teacher_id,
              is_active: classRow.is_active,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
