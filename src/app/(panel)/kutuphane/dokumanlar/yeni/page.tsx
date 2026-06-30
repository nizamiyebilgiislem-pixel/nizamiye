"use client";

import { useActionState } from "react";
import Link from "next/link";

import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { cn } from "@/lib/utils";
import { uploadDocumentAction } from "@/lib/library/actions";

export default function DokumanEklePage() {
  const [state, formAction] = useActionState(uploadDocumentAction, undefined);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">DokÃ¼man Ekle</CardTitle>
          <CardDescription>PDF, Word, Excel veya gÃ¶rsel dosyasÄ± yÃ¼kleyin.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-5">
            <label className="grid gap-2 text-sm font-medium">
              BaÅŸlÄ±k *
              <Input
                name="title"
                required
                placeholder="DokÃ¼man baÅŸlÄ±ÄŸÄ±"
                className="h-10"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium">
              Kategori
              <NativeSelect
                name="category_id"
                className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-ring"
              >
                <option value="">Kategori seÃ§in</option>
              </NativeSelect>
            </label>

            <label className="grid gap-2 text-sm font-medium">
              Dosya *
              <Input
                name="file"
                type="file"
                required
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp"
                className="h-10"
              />
              <p className="text-xs text-muted-foreground">Maksimum 20 MB. PDF, Word, Excel veya gÃ¶rsel.</p>
            </label>

            <label className="grid gap-2 text-sm font-medium">
              AÃ§Ä±klama
              <textarea
                name="description"
                placeholder="Opsiyonel aÃ§Ä±klama"
                rows={3}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm font-normal outline-none focus:border-ring"
              />
            </label>

            {state?.error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</div>
            )}

            {state?.success && (
              <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">DokÃ¼man baÅŸarÄ±yla yÃ¼klendi.</div>
            )}

            <div className="flex items-center gap-3">
              <FormSubmitButton pendingLabel="YÃ¼kleniyor...">DosyayÄ± YÃ¼kle</FormSubmitButton>
              <Link href="/kutuphane/dokumanlar" className={cn(buttonVariants({ variant: "outline" }))}>Ä°ptal</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
