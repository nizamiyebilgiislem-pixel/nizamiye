"use client";

import { useActionState } from "react";
import Link from "next/link";

import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createActivityAction, updateActivityAction } from "@/lib/guidance/actions";

type ProfileOption = { id: string; full_name: string };

type ActivityFormProps = {
  defaultValues?: {
    id?: string;
    title?: string;
    activity_type?: string;
    description?: string;
    location?: string;
    activity_date?: string;
    start_time?: string;
    end_time?: string;
    responsible_profile_id?: string;
    status?: string;
  };
  profiles: ProfileOption[];
};

const typeOptions = [
  { value: "trip", label: "Gezi" },
  { value: "seminar", label: "Seminer" },
  { value: "meeting", label: "Toplantı" },
  { value: "sports", label: "Spor" },
  { value: "cultural", label: "Kültürel" },
  { value: "activity", label: "Aktivite" },
];

export function ActivityForm({ defaultValues, profiles }: ActivityFormProps) {
  const action = defaultValues?.id ? updateActivityAction.bind(null, undefined) as unknown as (state: unknown, formData: FormData) => Promise<{ error?: string; success?: boolean }> : createActivityAction;
  const [state, formAction] = useActionState(action, undefined);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Etkinlik Bilgileri</CardTitle>
          <CardDescription>Etkinlik ve gezi planı detaylarını girin.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-5">
            {defaultValues?.id && <input type="hidden" name="id" value={defaultValues.id} />}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium">
                Başlık *
                <input name="title" required defaultValue={defaultValues?.title ?? ""} placeholder="Etkinlik adı" className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20" />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Tür *
                <select name="activity_type" defaultValue={defaultValues?.activity_type ?? "activity"} className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20">
                  {typeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </label>
            </div>

            <label className="grid gap-2 text-sm font-medium">
              Açıklama
              <textarea name="description" rows={3} defaultValue={defaultValues?.description ?? ""} placeholder="Etkinlik açıklaması" className="rounded-md border border-input bg-background px-3 py-2 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20" />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium">
                Yer
                <input name="location" defaultValue={defaultValues?.location ?? ""} placeholder="Etkinlik yeri" className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20" />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Sorumlu Kişi
                <select name="responsible_profile_id" defaultValue={defaultValues?.responsible_profile_id ?? ""} className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20">
                  <option value="">Seçiniz</option>
                  {profiles.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                </select>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="grid gap-2 text-sm font-medium">
                Tarih *
                <input name="activity_date" type="date" required defaultValue={defaultValues?.activity_date ?? new Date().toISOString().split("T")[0]} className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20" />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Başlangıç Saati
                <input name="start_time" type="time" defaultValue={defaultValues?.start_time ?? ""} className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20" />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Bitiş Saati
                <input name="end_time" type="time" defaultValue={defaultValues?.end_time ?? ""} className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20" />
              </label>
            </div>

            <label className="grid gap-2 text-sm font-medium">
              Durum
              <select name="status" defaultValue={defaultValues?.status ?? "planned"} className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20">
                <option value="planned">Planlandı</option>
                <option value="completed">Tamamlandı</option>
                <option value="cancelled">İptal</option>
              </select>
            </label>

            {state?.error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</div>
            )}

            <div className="flex items-center gap-3">
              <FormSubmitButton pendingLabel="Kaydediliyor...">Kaydet</FormSubmitButton>
              <Link href="/rehberlik/etkinlikler" className={cn(buttonVariants({ variant: "outline" }))}>İptal</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
