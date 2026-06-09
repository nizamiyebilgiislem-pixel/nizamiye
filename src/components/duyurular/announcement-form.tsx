"use client";

import { useActionState } from "react";
import Link from "next/link";

import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createAnnouncementAction, updateAnnouncementAction } from "@/lib/duyurular/actions";

type AnnouncementFormProps = {
  defaultValues?: {
    id?: string;
    title?: string;
    content?: string;
    target_role?: string;
    is_published?: boolean;
  };
};

const roleOptions = [
  { value: "", label: "Tüm Personel" },
  { value: "admin", label: "Admin" },
  { value: "genel_mudur", label: "Genel Müdür" },
  { value: "bolum_muduru", label: "Bölüm Müdürü" },
  { value: "hoca", label: "Hoca" },
];

export function AnnouncementForm({ defaultValues }: AnnouncementFormProps) {
  const action = defaultValues?.id
    ? (updateAnnouncementAction as unknown as (state: unknown, formData: FormData) => Promise<{ error?: string; success?: boolean }>)
    : createAnnouncementAction;
  const [state, formAction] = useActionState(action, undefined);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{defaultValues?.id ? "Duyuru Düzenle" : "Yeni Duyuru"}</CardTitle>
          <CardDescription>Kurum içi duyuru oluşturun veya düzenleyin.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-5">
            {defaultValues?.id && <input type="hidden" name="id" value={defaultValues.id} />}

            <label className="grid gap-2 text-sm font-medium">
              Başlık *
              <input name="title" required defaultValue={defaultValues?.title ?? ""} placeholder="Duyuru başlığı" className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20" />
            </label>

            <label className="grid gap-2 text-sm font-medium">
              İçerik *
              <textarea name="content" rows={8} required defaultValue={defaultValues?.content ?? ""} placeholder="Duyuru içeriği" className="rounded-md border border-input bg-background px-3 py-2 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20" />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium">
                Hedef Rol
                <select name="target_role" defaultValue={defaultValues?.target_role ?? ""} className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20">
                  {roleOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </label>

              <label className="flex items-center gap-2 text-sm font-medium pt-6">
                <input type="checkbox" name="is_published" value="true" defaultChecked={defaultValues?.is_published !== false} className="size-4 rounded border-border text-[#093657]" />
                Yayınla
              </label>
            </div>

            {state?.error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</div>
            )}

            <div className="flex items-center gap-3">
              <FormSubmitButton pendingLabel="Kaydediliyor...">Kaydet</FormSubmitButton>
              <Link href="/duyurular" className={cn(buttonVariants({ variant: "outline" }))}>İptal</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
