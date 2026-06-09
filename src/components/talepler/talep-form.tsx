"use client";

import { useActionState } from "react";
import Link from "next/link";

import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createTalepAction, editTalepAction } from "@/lib/talepler/actions";

const typeOptions = [
  { value: "talep", label: "Talep" },
  { value: "istek", label: "İstek" },
  { value: "bildirim", label: "Bildirim" },
];

type TalepFormProps = {
  defaultValues?: {
    id?: string;
    title?: string;
    description?: string;
    type?: string;
    priority?: string;
    requested_unit?: string;
    target_person?: string;
    deadline?: string;
  };
  unitOptions: { value: string; label: string }[];
};

export function TalepForm({ defaultValues, unitOptions }: TalepFormProps) {
  const action = defaultValues?.id
    ? (editTalepAction as unknown as (state: unknown, formData: FormData) => Promise<{ error?: string; success?: boolean }>)
    : createTalepAction;
  const [state, formAction] = useActionState(action, undefined);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{defaultValues?.id ? "Talebi Düzenle" : "Yeni Talep"}</CardTitle>
          <CardDescription>
            {defaultValues?.id ? "Talep başlık ve açıklamasını güncelleyin." : "Bir birime yeni talep oluşturun."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-5">
            {defaultValues?.id && <input type="hidden" name="id" value={defaultValues.id} />}

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium">
                Başlık *
                <input
                  name="title"
                  required
                  defaultValue={defaultValues?.title ?? ""}
                  placeholder="Talep başlığı"
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20"
                />
              </label>

              <label className="grid gap-2 text-sm font-medium">
                Tür
                <select
                  name="type"
                  defaultValue={defaultValues?.type ?? "talep"}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20"
                >
                  {typeOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </label>
            </div>

            <label className="grid gap-2 text-sm font-medium">
              Açıklama *
              <textarea
                name="description"
                rows={5}
                required
                defaultValue={defaultValues?.description ?? ""}
                placeholder="Talep açıklaması"
                className="rounded-md border border-input bg-background px-3 py-2 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              {!defaultValues?.id && (
                <label className="grid gap-2 text-sm font-medium">
                  Talep Edilen Birim *
                  <select
                    name="requested_unit"
                    required
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20"
                  >
                    {unitOptions.map((o) => (
                      <option key={o.value} value={o.value} disabled={o.value === ""}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <label className="grid gap-2 text-sm font-medium">
                Öncelik
                <select
                  name="priority"
                  defaultValue={defaultValues?.priority ?? "normal"}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20"
                >
                  <option value="normal">Normal</option>
                  <option value="acil">Acil</option>
                </select>
              </label>
            </div>

            <label className="grid gap-2 text-sm font-medium">
              Son Tarih
              <input
                type="date"
                name="deadline"
                defaultValue={defaultValues?.deadline ?? ""}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20"
              />
            </label>

            {state?.error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</div>
            )}

            <div className="flex items-center gap-3">
              <FormSubmitButton pendingLabel="Kaydediliyor...">Kaydet</FormSubmitButton>
              <Link href="/talepler" className={cn(buttonVariants({ variant: "outline" }))}>İptal</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
