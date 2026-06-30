"use client";

import { useActionState } from "react";
import Link from "next/link";

import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { editTaskAction } from "@/lib/tasks/actions";
import type { TaskRow } from "@/types/database";

const priorityOptions = [
  { value: "low", label: "Düşük" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "Yüksek" },
  { value: "urgent", label: "Acil" },
];

type AssignableProfile = {
  id: string;
  full_name: string;
  role: string;
  department_id: string | null;
};

type DepartmentOption = {
  id: string;
  name: string;
};

type TaskEditFormProps = {
  task: TaskRow;
  assignableProfiles: AssignableProfile[];
  departmentOptions: DepartmentOption[];
};

export function TaskEditForm({ task, assignableProfiles, departmentOptions }: TaskEditFormProps) {
  const [state, formAction] = useActionState(editTaskAction, undefined);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Görevi Düzenle</CardTitle>
          <CardDescription>Görev başlık, açıklama, öncelik ve atama bilgilerini güncelleyin.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-5">
            <input type="hidden" name="id" value={task.id} />

            <label className="grid gap-2 text-sm font-medium">
              Başlık *
              <input
                name="title"
                required
                defaultValue={task.title}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium">
              Açıklama
              <textarea
                name="description"
                rows={4}
                defaultValue={task.description ?? ""}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium">
                Öncelik
                <select
                  name="priority"
                  defaultValue={task.priority}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20"
                >
                  {priorityOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-medium">
                Son Tarih
                <input
                  type="date"
                  name="due_date"
                  defaultValue={task.due_date ?? ""}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium">
                Atanan Kişi
                <select
                  name="assigned_to"
                  defaultValue={task.assigned_to}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20"
                >
                  <option value="">Değiştirme</option>
                  {assignableProfiles.map((p) => (
                    <option key={p.id} value={p.id}>{p.full_name}</option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-medium">
                Bölüm
                <select
                  name="department_id"
                  defaultValue={task.department_id ?? ""}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20"
                >
                  <option value="">Bölüm seçilmedi</option>
                  {departmentOptions.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </label>
            </div>

            {state?.error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</div>
            )}

            <div className="flex items-center gap-3">
              <FormSubmitButton pendingLabel="Kaydediliyor...">Kaydet</FormSubmitButton>
              <Link href={`/gorevler/${task.id}`} className={cn(buttonVariants({ variant: "outline" }))}>İptal</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
