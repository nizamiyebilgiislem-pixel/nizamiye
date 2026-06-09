"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createSurveyAction } from "@/lib/guidance/actions";

type DepartmentOption = { id: string; name: string };
type ClassOption = { id: string; name: string };

type SurveyFormProps = {
  departments: DepartmentOption[];
  classes: ClassOption[];
};

export function SurveyForm({ departments, classes }: SurveyFormProps) {
  const [state, formAction] = useActionState(createSurveyAction, undefined);
  const [targetScope, setTargetScope] = useState("all_students");
  const router = useRouter();
  const surveyId = (state as { surveyId?: string } | null)?.surveyId;

  useEffect(() => {
    if (surveyId) {
      router.push(`/rehberlik/anketler/${surveyId}`);
    }
  }, [surveyId, router]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Anket Bilgileri</CardTitle>
          <CardDescription>Anket detaylarını girin. Sorular daha sonra eklenecek.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-5">
            <label className="grid gap-2 text-sm font-medium">
              Anket Adı *
              <input name="title" required placeholder="Anket adı" className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20" />
            </label>

            <label className="grid gap-2 text-sm font-medium">
              Açıklama
              <textarea name="description" rows={3} placeholder="Anket açıklaması" className="rounded-md border border-input bg-background px-3 py-2 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20" />
            </label>

            <label className="grid gap-2 text-sm font-medium">
              Hedef Kapsam
              <select name="target_scope" value={targetScope} onChange={(e) => setTargetScope(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20">
                <option value="all_students">Tüm Öğrenciler</option>
                <option value="department">Bölüm</option>
                <option value="class">Sınıf</option>
              </select>
            </label>

            {targetScope === "department" && (
              <label className="grid gap-2 text-sm font-medium">
                Bölüm
                <select name="department_id" className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20">
                  <option value="">Seçiniz</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </label>
            )}

            {targetScope === "class" && (
              <label className="grid gap-2 text-sm font-medium">
                Sınıf
                <select name="class_id" className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20">
                  <option value="">Seçiniz</option>
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
            )}

            <label className="flex items-center gap-2 text-sm font-medium">
              <input name="is_anonymous" type="checkbox" value="true" defaultChecked className="size-4 rounded border-border text-[#093657] focus:ring-[#093657]" />
              Anonim (öğrenci adı görünmez)
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium">
                Başlangıç Tarihi
                <input name="starts_at" type="date" className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20" />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Bitiş Tarihi
                <input name="ends_at" type="date" className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20" />
              </label>
            </div>

            <label className="grid gap-2 text-sm font-medium">
              Durum
              <select name="status" defaultValue="active" className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20">
                <option value="active">Aktif</option>
                <option value="draft">Taslak</option>
              </select>
            </label>

            {state?.error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</div>
            )}

            <div className="flex items-center gap-3">
              <FormSubmitButton pendingLabel="Oluşturuluyor...">Anket Oluştur</FormSubmitButton>
              <Link href="/rehberlik/anketler" className={cn(buttonVariants({ variant: "outline" }))}>İptal</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
