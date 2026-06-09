"use client";

import { useActionState } from "react";

import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { updateTalepStatusAction } from "@/lib/talepler/actions";

type TalepStatusFormProps = {
  talepId: string;
  currentStatus: string;
};

type StatusAction = { status: string; label: string; variant?: "default" | "destructive" | "outline" };

const nextActions: Record<string, StatusAction[]> = {
  bekliyor: [
    { status: "incelemede", label: "İncelemeye Al", variant: "default" },
    { status: "iptal_edildi", label: "İptal Et", variant: "outline" },
  ],
  incelemede: [
    { status: "isleme_alindi", label: "İşleme Al", variant: "default" },
    { status: "reddedildi", label: "Reddet", variant: "destructive" },
  ],
  isleme_alindi: [
    { status: "onaylandi", label: "Onayla", variant: "default" },
    { status: "reddedildi", label: "Reddet", variant: "destructive" },
  ],
  onaylandi: [
    { status: "tamamlandi", label: "Tamamlandı", variant: "default" },
  ],
};

export function TalepStatusForm({ talepId, currentStatus }: TalepStatusFormProps) {
  const [state, formAction] = useActionState(updateTalepStatusAction, undefined);
  const actions = nextActions[currentStatus] ?? [];

  if (actions.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Durum Güncelle</CardTitle>
        <CardDescription>Talebin durumunu güncelleyin.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <form key={action.status} action={formAction}>
              <input type="hidden" name="id" value={talepId} />
              <input type="hidden" name="status" value={action.status} />
              <FormSubmitButton pendingLabel="İşleniyor..." variant={action.variant ?? "default"} size="sm">
                {action.label}
              </FormSubmitButton>
            </form>
          ))}
        </div>

        <form action={formAction} className="mt-5 space-y-4">
          <input type="hidden" name="id" value={talepId} />
          <input type="hidden" name="status" value={currentStatus} />

          <label className="grid gap-2 text-sm font-medium">
            Cevap Notu
            <textarea
              name="response_note"
              rows={2}
              placeholder="Talebe verilen cevap"
              className="rounded-md border border-input bg-background px-3 py-2 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium">
            Red Sebebi (sadece reddetme durumunda)
            <textarea
              name="rejection_reason"
              rows={2}
              placeholder="Red sebebi"
              className="rounded-md border border-input bg-background px-3 py-2 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium">
            İç Not (sadece yetkililer görür)
            <textarea
              name="internal_note"
              rows={2}
              placeholder="Yetkililere özel not"
              className="rounded-md border border-input bg-background px-3 py-2 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20"
            />
          </label>

          {state?.error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</div>
          )}

          <FormSubmitButton pendingLabel="Güncelleniyor...">Notları Kaydet</FormSubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
