import { redirect } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { buttonVariants } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth";
import { canManageDormitories } from "@/lib/dormitory/permissions";
import { createDormitoryAction } from "@/lib/dormitory/actions";
import { cn } from "@/lib/utils";

export default async function DormitoryCreatePage() {
  const { profile } = await requireAuth();
  if (!canManageDormitories(profile)) {
    redirect("/yatakhane");
  }

  async function submitAction(formData: FormData) {
    "use server";
    await createDormitoryAction(formData);
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Yatakhane" title="Yeni Yatakhane" description="Yeni bir yatakhane kaydı oluşturun." />
      <Card>
        <CardContent className="p-4">
          <form action={submitAction} className="space-y-4">
            <Input name="name" required placeholder="Yatakhane adı" />
            <Textarea name="description" placeholder="Açıklama" />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="is_active" defaultChecked className="size-4 rounded border-border" />
              Aktif
            </label>
            <div className="flex justify-end">
              <button type="submit" className={cn(buttonVariants())}>
                Oluştur
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
