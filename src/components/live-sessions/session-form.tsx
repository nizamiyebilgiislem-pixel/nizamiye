"use client";

import { useActionState } from "react";
import Link from "next/link";

import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createSessionAction, updateSessionAction } from "@/lib/live-sessions/actions";
import type { LiveSessionRow } from "@/types/database";

const sessionTypeOptions = [
  { value: "ogretmen_toplantisi", label: "Öğretmen Toplantısı" },
  { value: "konuk_semineri", label: "Konuk Semineri" },
  { value: "bolum_toplantisi", label: "Bölüm Toplantısı" },
  { value: "veli_gorusmesi", label: "Veli Görüşmesi" },
  { value: "ozel_etkinlik", label: "Özel Etkinlik" },
];

type SessionFormProps = {
  session?: LiveSessionRow;
  departmentOptions: { id: string; name: string }[];
  currentProfileRole: string;
};

export function SessionForm({ session, departmentOptions, currentProfileRole }: SessionFormProps) {
  const action = session ? updateSessionAction : createSessionAction;
  const [state, formAction] = useActionState(action, undefined);

  const showDepartment = ["admin", "genel_mudur"].includes(currentProfileRole);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{session ? "Oturumu Düzenle" : "Yeni Oturum"}</CardTitle>
          <CardDescription>
            {session
              ? "Oturum bilgilerini güncelleyin."
              : "Kurum içi Jitsi toplantısı planlayın. Oda adı otomatik oluşturulacaktır."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-5">
            {session && <input type="hidden" name="id" value={session.id} />}

            <label className="grid gap-2 text-sm font-medium">
              Başlık *
              <input
                name="title"
                required
                defaultValue={session?.title ?? ""}
                placeholder="Oturum başlığı"
                className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium">
              Açıklama
              <textarea
                name="description"
                rows={3}
                defaultValue={session?.description ?? ""}
                placeholder="Oturum açıklaması"
                className="rounded-md border border-input bg-background px-3 py-2 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium">
                Oturum Türü *
                <select
                  name="session_type"
                  required
                  defaultValue={session?.session_type ?? ""}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20"
                >
                  <option value="">Tür seçin</option>
                  {sessionTypeOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-medium">
                Maks. Katılımcı
                <input
                  type="number"
                  name="max_participants"
                  min={1}
                  defaultValue={session?.max_participants ?? 20}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium">
                Başlangıç Zamanı *
                <input
                  type="datetime-local"
                  name="start_time"
                  required
                  defaultValue={session?.start_time ? new Date(session.start_time).toISOString().slice(0, 16) : ""}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20"
                />
              </label>

              <label className="grid gap-2 text-sm font-medium">
                Bitiş Zamanı
                <input
                  type="datetime-local"
                  name="end_time"
                  defaultValue={session?.end_time ? new Date(session.end_time).toISOString().slice(0, 16) : ""}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20"
                />
              </label>
            </div>

            {showDepartment && (
              <label className="grid gap-2 text-sm font-medium">
                Bölüm
                <select
                  name="department_id"
                  defaultValue={session?.department_id ?? ""}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20"
                >
                  <option value="">Bölüm seçin</option>
                  {departmentOptions.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </label>
            )}

            <label className="grid gap-2 text-sm font-medium">
              Notlar
              <textarea
                name="notes"
                rows={2}
                defaultValue={session?.notes ?? ""}
                placeholder="İç notlar (katılımcılar görmez)"
                className="rounded-md border border-input bg-background px-3 py-2 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20"
              />
            </label>

            {state?.error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</div>
            )}

            {state?.success && (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                Oturum başarıyla {session ? "güncellendi" : "oluşturuldu"}.
              </div>
            )}

            <div className="flex items-center gap-3">
              <FormSubmitButton pendingLabel={session ? "Güncelleniyor..." : "Oluşturuluyor..."}>
                {session ? "Güncelle" : "Oluştur"}
              </FormSubmitButton>
              <Link
                href={session ? `/canli-oturumlar/${session.id}` : "/canli-oturumlar"}
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                İptal
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
