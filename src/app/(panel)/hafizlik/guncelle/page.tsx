import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { BulkUpdateForm } from "@/components/hafizlik/bulk-update-form";
import { PageHeader } from "@/components/layout/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { NativeSelect } from "@/components/ui/native-select";
import { requireAuth } from "@/lib/auth";
import { bulkUpdateHafizlikProgressAction, getHafizlikStudentsForBulk } from "@/lib/hafizlik/actions";

type BulkUpdatePageProps = {
  searchParams: Promise<{ success?: string; department?: string }>;
};

export default async function BulkUpdatePage({ searchParams }: BulkUpdatePageProps) {
  const { profile } = await requireAuth();
  const query = await searchParams;

  if (!["admin", "genel_mudur", "bolum_muduru", "hoca"].includes(profile.role)) {
    redirect("/dashboard?error=unauthorized");
  }

  const { students, department, departments, canSelectDepartment } = await getHafizlikStudentsForBulk(profile, query.department);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/hafizlik${department ? `?department=${department.id}` : ""}`} className={buttonVariants({ variant: "ghost", size: "icon" })}>
          <ArrowLeft className="size-4" />
        </Link>
        <PageHeader
          title="Toplu Hafızlık Güncelleme"
          description={`${department?.name ?? "Bölüm"} bölümündeki aktif öğrencilerin hafızlık ilerlemesini toplu güncelle.`}
        />
      </div>

      {query.success ? (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
          {query.success} öğrenci güncellendi.
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle>Ã–ğrenci Listesi</CardTitle>
            {canSelectDepartment && departments.length > 1 ? (
              <form className="flex gap-2">
                <NativeSelect
                  name="department"
                  defaultValue={department?.id ?? departments[0]?.id ?? ""}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {departments.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </NativeSelect>
                <Button type="submit" variant="outline">Bölümü Aç</Button>
              </form>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          {students.length > 0 && department ? (
            <BulkUpdateForm
              students={students}
              departmentId={department.id}
              updateAction={bulkUpdateHafizlikProgressAction}
            />
          ) : (
            <EmptyState title="Bu bölümde aktif öğrenci bulunmuyor." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
