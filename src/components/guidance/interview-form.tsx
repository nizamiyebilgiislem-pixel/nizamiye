"use client";

import { useActionState, useState } from "react";
import Link from "next/link";

import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type StudentOption = { id: string; full_name: string };

type InterviewFormProps = {
  action: (previousState: unknown, formData: FormData) => Promise<{ error?: string; success?: boolean }>;
  preselectedStudentId?: string;
  students: StudentOption[];
  defaultValues?: {
    student_id?: string;
    interview_date?: string;
    interview_type?: string;
    visibility?: string;
    title?: string;
    summary?: string;
    private_notes?: string;
    emotional_state?: string;
    academic_state?: string;
    social_state?: string;
    action_plan?: string;
    next_follow_up_date?: string;
    status?: string;
  };
};

export function InterviewForm({ action, preselectedStudentId, students, defaultValues }: InterviewFormProps) {
  const [state, formAction] = useActionState(action, undefined);
  const [studentId, setStudentId] = useState(defaultValues?.student_id ?? preselectedStudentId ?? "");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Görüşme Bilgileri</CardTitle>
          <CardDescription>Öğrenci ve görüşme detaylarını girin.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-5">
            {defaultValues?.student_id && <input type="hidden" name="student_id" value={defaultValues.student_id} />}

            <label className="grid gap-2 text-sm font-medium">
              Öğrenci *
              <select
                name="student_id"
                required
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20"
              >
                <option value="">Seçiniz</option>
                {students.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
              </select>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium">
                Görüşme Tarihi *
                <input name="interview_date" type="date" required defaultValue={defaultValues?.interview_date ?? new Date().toISOString().split("T")[0]} className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20" />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Görüşme Türü *
                <select name="interview_type" defaultValue={defaultValues?.interview_type ?? "individual"} className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20">
                  <option value="individual">Bireysel</option>
                  <option value="group">Grup</option>
                  <option value="parent">Veli</option>
                  <option value="emergency">Acil</option>
                  <option value="follow_up">Takip</option>
                </select>
              </label>
            </div>

            <label className="grid gap-2 text-sm font-medium">
              Görünürlük
              <select name="visibility" defaultValue={defaultValues?.visibility ?? "private"} className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20">
                <option value="private">Özel (sadece rehberlik/admin)</option>
                <option value="summary">Sadece Özet (bölüm müdürü/hoca özeti görebilir)</option>
                <option value="shared">Paylaşıldı (herkes görebilir)</option>
              </select>
            </label>

            <label className="grid gap-2 text-sm font-medium">
              Başlık *
              <input name="title" required defaultValue={defaultValues?.title ?? ""} placeholder="Görüşme başlığı" className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20" />
            </label>

            <label className="grid gap-2 text-sm font-medium">
              Özet
              <textarea name="summary" rows={3} defaultValue={defaultValues?.summary ?? ""} placeholder="Görüşme özeti" className="rounded-md border border-input bg-background px-3 py-2 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20" />
            </label>

            <label className="grid gap-2 text-sm font-medium">
              <span className="flex items-center gap-1">
                Özel Notlar
                <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">Sadece rehberlik/admin</span>
              </span>
              <textarea name="private_notes" rows={3} defaultValue={defaultValues?.private_notes ?? ""} placeholder="Özel notlar (sadece yetkili kullanıcılar görebilir)" className="rounded-md border border-input bg-background px-3 py-2 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20" />
            </label>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { name: "emotional_state", label: "Duygusal Durum", placeholder: "Duygusal durum" },
                { name: "academic_state", label: "Akademik Durum", placeholder: "Akademik durum" },
                { name: "social_state", label: "Sosyal Durum", placeholder: "Sosyal durum" },
              ].map((field) => (
                <label key={field.name} className="grid gap-2 text-sm font-medium">
                  {field.label}
                  <input name={field.name} defaultValue={(defaultValues as Record<string, string>)?.[field.name] ?? ""} placeholder={field.placeholder} className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20" />
                </label>
              ))}
            </div>

            <label className="grid gap-2 text-sm font-medium">
              Aksiyon Planı
              <textarea name="action_plan" rows={3} defaultValue={defaultValues?.action_plan ?? ""} placeholder="Yapılacaklar ve aksiyonlar" className="rounded-md border border-input bg-background px-3 py-2 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20" />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium">
                Sonraki Takip Tarihi
                <input name="next_follow_up_date" type="date" defaultValue={defaultValues?.next_follow_up_date ?? ""} className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20" />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Durum
                <select name="status" defaultValue={defaultValues?.status ?? "open"} className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20">
                  <option value="open">Açık</option>
                  <option value="followed">Takip Ediliyor</option>
                  <option value="closed">Kapalı</option>
                </select>
              </label>
            </div>

            {state?.error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</div>
            )}

            <div className="flex items-center gap-3">
              <FormSubmitButton pendingLabel="Kaydediliyor...">Kaydet</FormSubmitButton>
              <Link href="/rehberlik/gorusmeler" className={cn(buttonVariants({ variant: "outline" }))}>İptal</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
