import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { StudentTaskForm } from "@/components/student-tasks/student-task-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { canCreateStudentTask } from "@/lib/student-tasks/permissions";
import { getStudentsForTaskAssignment } from "@/lib/student-tasks/queries";

export default async function NewStudentTaskPage() {
  const { profile } = await requireAuth();

  if (!canCreateStudentTask(profile)) {
    redirect("/gorevler?error=unauthorized");
  }

  const students = await getStudentsForTaskAssignment(profile);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/gorevler/ogrenci-gorevleri" className={buttonVariants({ variant: "ghost", size: "icon" })}>
          <ArrowLeft className="size-4" />
        </Link>
        <PageHeader
          title="Yeni Öğrenci Görevi"
          description="Öğrencileri görevlendirin (nöbet, temizlik, yemek vb.)"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Öğrenci Görevi Oluştur</CardTitle>
        </CardHeader>
        <CardContent>
          {students.length > 0 ? (
            <StudentTaskForm students={students} />
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Görev atayabileceğiniz öğrenci bulunamadı.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}