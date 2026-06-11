"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus } from "lucide-react";

import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { useToast } from "@/components/toast/toast-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createAcademicTermAction } from "@/lib/terms/management-actions";
import type { CreateAcademicTermActionState } from "@/lib/terms/management-actions";

const initialState: CreateAcademicTermActionState = {
  success: false,
  error: "",
};

export function AcademicTermCreateForm() {
  const router = useRouter();
  const { addToast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const lastSuccessRef = useRef<string | null>(null);
  const [state, action] = useActionState(createAcademicTermAction, initialState);

  useEffect(() => {
    if (state.success && lastSuccessRef.current !== state.termId) {
      lastSuccessRef.current = state.termId;
      formRef.current?.reset();
      addToast("success", "Yeni dönem oluşturuldu", state.message);
      router.refresh();
    }
  }, [addToast, router, state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarPlus className="size-4" aria-hidden="true" />
          Yeni Dönem Oluştur
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={action} className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_180px_180px_auto] lg:items-end">
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Dönem adı</span>
            <input
              name="name"
              placeholder="2027-2028"
              className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm shadow-sm outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Başlangıç tarihi</span>
            <input
              name="start_date"
              type="date"
              className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm shadow-sm outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Bitiş tarihi</span>
            <input
              name="end_date"
              type="date"
              className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm shadow-sm outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20"
            />
          </label>
          <FormSubmitButton pendingLabel="Oluşturuluyor..." className="bg-[#093657] text-white hover:bg-[#082b46]">
            Oluştur
          </FormSubmitButton>
        </form>

        {!state.success && state.error ? (
          <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {state.error}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
