"use client";

import { useActionState } from "react";
import Link from "next/link";

import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DormitoryWithDepartment } from "@/lib/dormitory/queries";

type DepartmentOption = { id: string; name: string };

type DormitoryFormProps = {
  action: (previousState: unknown, formData: FormData) => Promise<{ error?: string }>;
  title: string;
  description: string;
  dormitory?: DormitoryWithDepartment;
  departments: DepartmentOption[];
};

export function DormitoryForm({ action, title, description, dormitory, departments }: DormitoryFormProps) {
  const [state, formAction] = useActionState(action, undefined);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-5">
            {dormitory ? <input type="hidden" name="id" value={dormitory.id} /> : null}

            <label className="grid gap-2 text-sm font-medium">
              Bölüm
              <select
                name="department_id"
                defaultValue={dormitory?.department_id ?? ""}
                required
                className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-ring"
              >
                <option value="" disabled>Bölüm seçin</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-medium">
              Yatakhane Adı
              <input
                name="name"
                defaultValue={dormitory?.name ?? ""}
                required
                placeholder="Örn: Yatakhane A"
                className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-ring"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium">
              Kapasite
              <input
                name="capacity"
                type="number"
                min="1"
                defaultValue={dormitory?.capacity ?? ""}
                required
                placeholder="Örn: 12"
                className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-ring"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium">
              Açıklama
              <textarea
                name="description"
                defaultValue={dormitory?.description ?? ""}
                placeholder="Opsiyonel açıklama"
                rows={3}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm font-normal outline-none focus:border-ring"
              />
            </label>

            {dormitory ? (
              <label className="grid gap-2 text-sm font-medium">
                Durum
                <select
                  name="is_active"
                  defaultValue={String(dormitory.is_active)}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-ring"
                >
                  <option value="true">Aktif</option>
                  <option value="false">Pasif</option>
                </select>
              </label>
            ) : (
              <input type="hidden" name="is_active" value="true" />
            )}

            {state?.error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</div>
            )}

            <div className="flex items-center gap-3">
              <FormSubmitButton pendingLabel="Kaydediliyor...">
                {dormitory ? "Değişiklikleri Kaydet" : "Yatakhaneyi Kaydet"}
              </FormSubmitButton>
              <Link href={dormitory ? `/yatakhane/${dormitory.id}` : "/yatakhane"} className={cn(buttonVariants({ variant: "outline" }))}>
                İptal
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
