import Link from "next/link";
import { redirect } from "next/navigation";

import { ArrowLeft } from "lucide-react";

import { BulkUpdateForm } from "@/components/hafizlik/bulk-update-form";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth";
import { bulkUpdateHafizlikProgressAction, getHafizlikStudentsForBulk } from "@/lib/hafizlik/actions";

type BulkUpdatePageProps = {
  params: Promise<{}>;
  searchParams: Promise<{ success?: string }>;
};

export default async function BulkUpdatePage({ params, searchParams }: BulkUpdatePageProps) {
  const { profile } = await requireAuth();
  const query = await searchParams;

  if (!["admin", "genel_mudur", "bolum_muduru", "hoca"].includes(profile.role)) {
    redirect("/dashboard?error=unauthorized");
  }

  const { students, department } = await getHafizlikStudentsForBulk(profile.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/hafizlik" className={buttonVariants({ variant: "ghost", size: "icon" })}>
          <ArrowLeft className="size-4" />
        </Link>
        <PageHeader
          title="Toplu Hafızlık Güncelleme"
          description={`${department?.name ?? "Hafızlık"} bölümündeki öğrencilerin hafızlık ilerlemesini toplu güncelle.`}
        />
      </div>

      {query.success && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
          {query.success} öğrenci güncellendi.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Öğrenci Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          {students.length > 0 ? (
            <BulkUpdateForm students={students} updateAction={bulkUpdateHafizlikProgressAction} />
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Bu bölümde aktif öğrenci bulunmuyor.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}