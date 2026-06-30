"use client";

import { useActionState } from "react";
import Link from "next/link";

import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { createTaskAction } from "@/lib/tasks/actions";
import type { AssignableProfile } from "@/lib/tasks/queries";

const priorityOptions = [
  { value: "low", label: "Düşük" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "Yüksek" },
  { value: "urgent", label: "Acil" },
];

type TaskFormProps = {
  assignableProfiles: AssignableProfile[];
  departmentOptions: { id: string; name: string }[];
  currentProfileRole: string;
};

export function TaskForm({ assignableProfiles, departmentOptions, currentProfileRole }: TaskFormProps) {
  const [state, formAction] = useActionState(createTaskAction, undefined);

  const showDepartment = ["admin", "genel_mudur"].includes(currentProfileRole);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Yeni Görev</CardTitle>
          <CardDescription>Kurum içi personele yapılacak iş veya sorumluluk atayın. Bu alan rol atama sistemi değildir.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-5">
            <label className="grid gap-2 text-sm font-medium">
              Başlık *
              <Input
                name="title"
                required
                placeholder="Görev başlığı"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium">
              Açıklama
              <Textarea
                name="description"
                rows={4}
                placeholder="Görev açıklaması"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium">
                Atanacak Kişi *
                <NativeSelect
                  name="assigned_to"
                  required
                >
                  <option value="">Personel seçin</option>
                  {assignableProfiles.map((p) => (
                    <option key={p.id} value={p.id}>{p.full_name}</option>
                  ))}
                </NativeSelect>
              </label>

              <label className="grid gap-2 text-sm font-medium">
                Öncelik
                <NativeSelect
                  name="priority"
                  defaultValue="normal"
                >
                  {priorityOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </NativeSelect>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {showDepartment && (
                <label className="grid gap-2 text-sm font-medium">
                  Bölüm
                  <NativeSelect
                    name="department_id"
                  >
                    <option value="">Bölüm seçin</option>
                    {departmentOptions.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </NativeSelect>
                </label>
              )}

              <label className="grid gap-2 text-sm font-medium">
                Son Tarih
                <Input
                  type="date"
                  name="due_date"
                />
              </label>
            </div>

            {state?.error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</div>
            )}

            <div className="flex items-center gap-3">
              <FormSubmitButton pendingLabel="Oluşturuluyor...">Oluştur</FormSubmitButton>
              <Link href="/gorevler" className={cn(buttonVariants({ variant: "outline" }))}>İptal</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
