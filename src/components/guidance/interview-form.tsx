"use client";

import { useActionState, useState } from "react";
import Link from "next/link";

import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
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
              <NativeSelect
                name="student_id"
                required
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
              >
                <option value="">Seçiniz</option>
                {students.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
              </NativeSelect>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium">
                Görüşme Tarihi *
                <Input name="interview_date" type="date" required defaultValue={defaultValues?.interview_date ?? new Date().toISOString().split("T")[0]} />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Görüşme Türü *
                <NativeSelect name="interview_type" defaultValue={defaultValues?.interview_type ?? "individual"}>
                  <option value="individual">Bireysel</option>
                  <option value="group">Grup</option>
                  <option value="parent">Veli</option>
                  <option value="emergency">Acil</option>
                  <option value="follow_up">Takip</option>
                </NativeSelect>
              </label>
            </div>

            <label className="grid gap-2 text-sm font-medium">
              Görünürlük
              <NativeSelect name="visibility" defaultValue={defaultValues?.visibility ?? "private"}>
                <option value="private">Özel (sadece rehberlik/admin)</option>
                <option value="summary">Sadece Özet (bölüm müdürü/hoca özeti görebilir)</option>
                <option value="shared">Paylaşıldı (herkes görebilir)</option>
              </NativeSelect>
            </label>

            <label className="grid gap-2 text-sm font-medium">
              Başlık *
              <Input name="title" required defaultValue={defaultValues?.title ?? ""} placeholder="Görüşme başlığı" />
            </label>

            <label className="grid gap-2 text-sm font-medium">
              Özet
              <Textarea name="summary" rows={3} defaultValue={defaultValues?.summary ?? ""} placeholder="Görüşme özeti" />
            </label>

            <label className="grid gap-2 text-sm font-medium">
              <span className="flex items-center gap-1">
                Özel Notlar
                <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">Sadece rehberlik/admin</span>
              </span>
              <Textarea name="private_notes" rows={3} defaultValue={defaultValues?.private_notes ?? ""} placeholder="Özel notlar (sadece yetkili kullanıcılar görebilir)" />
            </label>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { name: "emotional_state", label: "Duygusal Durum", placeholder: "Duygusal durum" },
                { name: "academic_state", label: "Akademik Durum", placeholder: "Akademik durum" },
                { name: "social_state", label: "Sosyal Durum", placeholder: "Sosyal durum" },
              ].map((field) => (
                <label key={field.name} className="grid gap-2 text-sm font-medium">
                  {field.label}
                  <Input name={field.name} defaultValue={(defaultValues as Record<string, string>)?.[field.name] ?? ""} placeholder={field.placeholder} />
                </label>
              ))}
            </div>

            <label className="grid gap-2 text-sm font-medium">
              Aksiyon Planı
              <Textarea name="action_plan" rows={3} defaultValue={defaultValues?.action_plan ?? ""} placeholder="Yapılacaklar ve aksiyonlar" />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium">
                Sonraki Takip Tarihi
                <Input name="next_follow_up_date" type="date" defaultValue={defaultValues?.next_follow_up_date ?? ""} />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Durum
                <NativeSelect name="status" defaultValue={defaultValues?.status ?? "open"}>
                  <option value="open">Açık</option>
                  <option value="followed">Takip Ediliyor</option>
                  <option value="closed">Kapalı</option>
                </NativeSelect>
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
