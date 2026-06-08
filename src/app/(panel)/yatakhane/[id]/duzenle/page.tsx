import { notFound, redirect } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { buttonVariants } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth";
import { canManageDormitories } from "@/lib/dormitory/permissions";
import { getDormitoryById } from "@/lib/dormitory/queries";
import { updateDormitoryAction } from "@/lib/dormitory/actions";
import { cn } from "@/lib/utils";

type DormitoryEditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function DormitoryEditPage({ params }: DormitoryEditPageProps) {
  const { id } = await params;
  const { profile } = await requireAuth();
  if (!canManageDormitories(profile)) {
    redirect("/yatakhane");
  }

  const dormitory = await getDormitoryById(profile, id);
  if (!dormitory) {
    notFound();
  }

  async function submitAction(formData: FormData) {
    "use server";
    await updateDormitoryAction(formData);
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Yatakhane" title={`${dormitory.name} Düzenle`} description="Temel yatakhane bilgilerini güncelleyin." />
      <Card>
        <CardContent className="p-4">
          <form action={submitAction} className="space-y-4">
            <input type="hidden" name="id" value={dormitory.id} />
            <Input name="name" required defaultValue={dormitory.name} placeholder="Yatakhane adı" />
            <Textarea name="description" defaultValue={dormitory.description ?? ""} placeholder="Açıklama" />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="is_active" defaultChecked={dormitory.is_active} className="size-4 rounded border-border" />
              Aktif
            </label>
            <div className="flex justify-end">
              <button type="submit" className={cn(buttonVariants())}>
                Kaydet
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
