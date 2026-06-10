import Link from "next/link";
import { redirect } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DersSistemiEditForm } from "@/components/ders-sistemi/ders-sistemi-edit-form";
import { PageHeader } from "@/components/layout/page-header";
import { ProfileErrorMessage } from "@/components/profiles/profile-error-message";
import { requireRole } from "@/lib/auth";
import { getDersSistemiEditData } from "@/lib/ders-sistemi/queries";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
};

export default async function EditDersPage({ params, searchParams }: Props) {
  const { id } = await params;
  const search = await searchParams;
  const { profile } = await requireRole(["admin", "genel_mudur", "bolum_muduru"]);
  const editData = await getDersSistemiEditData(profile, id);

  if (!editData) {
    redirect("/ders-sistemi?error=notfound");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <PageHeader
          eyebrow="Ders Sistemi"
          title={`Düzenle: ${editData.course.name}`}
          description="Ders adını, durumunu ve sınıf atamalarını yönetin."
        />
        <Link
          href="/ders-sistemi"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          ← Geri
        </Link>
      </div>
      <ProfileErrorMessage error={search.error} />

      <Card>
        <CardHeader>
          <CardTitle>Ders Bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <DersSistemiEditForm
            course={editData.course}
            departments={editData.departments}
            classes={editData.classes}
            teachers={editData.teachers}
            assignedClassIds={editData.assignedClassIds}
            profileRole={profile.role}
            profileDepartmentId={profile.department_id}
          />
        </CardContent>
      </Card>
    </div>
  );
}
