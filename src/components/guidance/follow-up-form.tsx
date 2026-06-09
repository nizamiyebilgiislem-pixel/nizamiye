"use client";

import { useActionState } from "react";
import Link from "next/link";

import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type StudentOption = { id: string; full_name: string };
type ProfileOption = { id: string; full_name: string };
type InterviewOption = { id: string; title: string };

type FollowUpFormProps = {
  action: (previousState: unknown, formData: FormData) => Promise<{ error?: string; success?: boolean }>;
  students: StudentOption[];
  profiles: ProfileOption[];
  interviews: InterviewOption[];
};

export function FollowUpForm({ action, students, profiles, interviews }: FollowUpFormProps) {
  const [state, formAction] = useActionState(action, undefined);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Takip Bilgileri</CardTitle>
          <CardDescription>Takip planı detaylarını girin.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-5">
            <label className="grid gap-2 text-sm font-medium">
              Öğrenci *
              <select name="student_id" required className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20">
                <option value="">Seçiniz</option>
                {students.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-medium">
              İlişkili Görüşme (opsiyonel)
              <select name="interview_id" className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20">
                <option value="">Seçiniz</option>
                {interviews.map((i) => <option key={i.id} value={i.id}>{i.title}</option>)}
              </select>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium">
                Takip Tarihi *
                <input name="follow_up_date" type="date" required defaultValue={new Date().toISOString().split("T")[0]} className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20" />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Atanan Kişi
                <select name="assigned_to" className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20">
                  <option value="">Seçiniz</option>
                  {profiles.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                </select>
              </label>
            </div>

            <label className="grid gap-2 text-sm font-medium">
              Başlık *
              <input name="title" required placeholder="Takip başlığı" className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20" />
            </label>

            <label className="grid gap-2 text-sm font-medium">
              Açıklama
              <textarea name="description" rows={3} placeholder="Takip açıklaması" className="rounded-md border border-input bg-background px-3 py-2 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20" />
            </label>

            <label className="grid gap-2 text-sm font-medium">
              Durum
              <select name="status" className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20">
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
              <Link href="/rehberlik/takipler" className={cn(buttonVariants({ variant: "outline" }))}>İptal</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
