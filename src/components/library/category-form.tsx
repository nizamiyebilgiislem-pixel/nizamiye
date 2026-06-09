"use client";

import { useActionState } from "react";

import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type CategoryFormProps = {
  action: (previousState: unknown, formData: FormData) => Promise<{ error?: string; success?: boolean }>;
};

export function CategoryForm({ action }: CategoryFormProps) {
  const [state, formAction] = useActionState(action, undefined);

  return (
    <Card className="bg-white">
      <CardHeader className="border-b border-border pb-3">
        <CardTitle className="text-base">Yeni Kategori</CardTitle>
        <CardDescription>Yeni bir kitap/doküman kategorisi ekleyin.</CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <form action={formAction} className="space-y-4">
          <label className="grid gap-2 text-sm font-medium">
            Kategori Adı *
            <input
              name="name"
              required
              placeholder="Örn: Tefsir"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-ring"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium">
            Açıklama
            <textarea
              name="description"
              placeholder="Opsiyonel açıklama"
              rows={2}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm font-normal outline-none focus:border-ring"
            />
          </label>

          {state?.error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</div>
          )}

          {state?.success && (
            <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">Kategori eklendi.</div>
          )}

          <FormSubmitButton pendingLabel="Ekleniyor...">Kategori Ekle</FormSubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
