"use client";

import { useState } from "react";

import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { slugify } from "@/lib/slug";
import type { DepartmentRow } from "@/types/database";

type DepartmentFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  mode: "create" | "edit";
  initialValues?: DepartmentRow;
};

export function DepartmentForm({ action, mode, initialValues }: DepartmentFormProps) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const slug = slugify(name);

  return (
    <form action={action} className="space-y-5">
      {initialValues ? <input type="hidden" name="id" value={initialValues.id} /> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium md:col-span-2">
          Bölüm Adı
          <input
            name="name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-ring"
          />
        </label>
        <div className="grid gap-2 text-sm font-medium">
          Slug
          <input
            value={slug}
            readOnly
            className="h-10 rounded-md border border-input bg-muted px-3 text-sm font-normal text-muted-foreground outline-none"
          />
        </div>
        <label className="grid gap-2 text-sm font-medium md:col-span-2">
          Açıklama
          <textarea
            name="description"
            defaultValue={initialValues?.description ?? ""}
            rows={4}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm font-normal outline-none focus:border-ring"
          />
        </label>
        {mode === "edit" ? (
          <label className="grid gap-2 text-sm font-medium">
            Durum
            <select
              name="is_active"
              defaultValue={String(initialValues?.is_active ?? true)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-ring"
            >
              <option value="true">Aktif</option>
              <option value="false">Pasif</option>
            </select>
          </label>
        ) : (
          <input type="hidden" name="is_active" value="true" />
        )}
      </div>

      <div className="flex justify-end">
        <FormSubmitButton pendingLabel="Kaydediliyor...">{mode === "create" ? "Bölümü Kaydet" : "Değişiklikleri Kaydet"}</FormSubmitButton>
      </div>
    </form>
  );
}
