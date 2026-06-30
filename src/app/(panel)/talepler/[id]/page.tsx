import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";

import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { deleteTalepAction } from "@/lib/talepler/actions";

import { PageHeader } from "@/components/layout/page-header";
import { TalepStatusForm } from "@/components/talepler/talep-status-form";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth";
import { canEditTalep, canManageTalepStatus, canViewTalep, canViewTalepler } from "@/lib/talepler/permissions";
import { getTalepById, getUnitLabel, priorityLabels, statusLabels } from "@/lib/talepler/queries";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  bekliyor: "bg-yellow-100 text-yellow-800 border-yellow-300",
  incelemede: "bg-blue-100 text-blue-800 border-blue-300",
  isleme_alindi: "bg-indigo-100 text-indigo-800 border-indigo-300",
  onaylandi: "bg-green-100 text-green-800 border-green-300",
  reddedildi: "bg-red-100 text-red-800 border-red-300",
  tamamlandi: "bg-gray-100 text-gray-800 border-gray-300",
  iptal_edildi: "bg-orange-100 text-orange-800 border-orange-300",
};

const emptyValue = "-";
const dateFormatter = new Intl.DateTimeFormat("tr-TR", {
  dateStyle: "medium",
  timeZone: "Europe/Istanbul",
});
const dateTimeFormatter = new Intl.DateTimeFormat("tr-TR", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "Europe/Istanbul",
});

export default async function TalepDetayPage({ params }: { params: Promise<{ id: string }> }) {
  const { profile } = await requireAuth();
  const { id } = await params;

  if (!canViewTalepler(profile)) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        Bu sayfaya erişim yetkiniz bulunmamaktadır.
      </div>
    );
  }

  const talep = await getTalepById(id);
  if (!talep) notFound();
  if (!canViewTalep(profile, talep)) notFound();

  const canManageStatus = canManageTalepStatus(profile, talep);
  const canEdit = canEditTalep(profile, talep);
  const unitLabel = await getUnitLabel(talep.requested_unit);
  const statusColor = statusColors[talep.status] ?? "";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Talep Yönetimi"
        title={talep.title}
        actions={
          canEdit ? (
            <div className="flex gap-2">
              <Link href={`/talepler/${id}/duzenle`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                <Pencil className="mr-1.5 size-4" />
                Düzenle
              </Link>
              <form action={deleteTalepAction.bind(null, id) as unknown as (formData: FormData) => void}>
                <FormSubmitButton variant="destructive" size="sm">
                  <Trash2 className="mr-1.5 size-4" /> Sil
                </FormSubmitButton>
              </form>
            </div>
          ) : undefined
        }
      />

      <Card>
        <CardContent className="space-y-5 pt-6">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium", statusColor)}>
              {statusLabels[talep.status] ?? talep.status}
            </span>
            <Badge variant="secondary">{unitLabel}</Badge>
            {talep.priority === "acil" ? (
              <span className="inline-flex items-center rounded-md border border-red-300 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                {priorityLabels.acil}
              </span>
            ) : null}
            <span className="text-muted-foreground">{priorityLabels[talep.priority] ?? talep.priority}</span>
          </div>

          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <InfoRow label="Talep No" value={`#${talep.id.slice(0, 8)}`} />
            <InfoRow label="Tür" value={talep.type} />
            <InfoRow label="Talep Eden" value={talep.requester?.full_name ?? emptyValue} />
            <InfoRow label="Talep Edilen Birim" value={unitLabel} />
            <InfoRow label="Hedef Kişi" value={talep.target?.full_name ?? emptyValue} />
            <InfoRow label="İşleyen" value={talep.assignee?.full_name ?? emptyValue} />
            <InfoRow label="Son Tarih" value={talep.deadline ? dateFormatter.format(new Date(talep.deadline)) : emptyValue} />
            <InfoRow label="Oluşturulma" value={dateTimeFormatter.format(new Date(talep.created_at))} />
            {talep.updated_at !== talep.created_at ? (
              <InfoRow label="Son Güncelleme" value={dateTimeFormatter.format(new Date(talep.updated_at))} />
            ) : null}
          </div>

          <div className="border-t border-border pt-4">
            <p className="mb-1 text-xs font-medium text-muted-foreground">Açıklama</p>
            <div className="whitespace-pre-wrap text-sm leading-relaxed">{talep.description}</div>
          </div>

          {talep.response_note ? (
            <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2">
              <p className="text-xs font-medium text-green-700">Cevap Notu</p>
              <p className="mt-0.5 text-sm text-green-800">{talep.response_note}</p>
            </div>
          ) : null}

          {talep.rejection_reason ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2">
              <p className="text-xs font-medium text-red-700">Red Sebebi</p>
              <p className="mt-0.5 text-sm text-red-800">{talep.rejection_reason}</p>
            </div>
          ) : null}

          {talep.internal_note && profile.role === "admin" ? (
            <div className="rounded-md border border-orange-200 bg-orange-50 px-3 py-2">
              <p className="text-xs font-medium text-orange-700">İç Not (Admin)</p>
              <p className="mt-0.5 text-sm text-orange-800">{talep.internal_note}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {canManageStatus && !["tamamlandi", "reddedildi", "iptal_edildi"].includes(talep.status) ? (
        <TalepStatusForm talepId={id} currentStatus={talep.status} />
      ) : null}

      <Link href="/talepler" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
        <ArrowLeft className="mr-1.5 size-4" />
        Tüm Talepler
      </Link>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
