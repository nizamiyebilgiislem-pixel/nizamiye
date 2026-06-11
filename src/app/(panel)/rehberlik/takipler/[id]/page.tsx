import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth";
import { canManageGuidance } from "@/lib/guidance/permissions";
import { getFollowUpById } from "@/lib/guidance/queries";
import { completeFollowUpAction, cancelFollowUpAction } from "@/lib/guidance/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FormSubmitButton } from "@/components/forms/form-submit-button";

const statusLabels: Record<string, string> = { planned: "Planlandı", completed: "Tamamlandı", cancelled: "İptal" };
const statusColors: Record<string, "default" | "secondary" | "destructive"> = { planned: "secondary", completed: "default", cancelled: "destructive" };

export default async function TakipDetayPage({ params }: { params: Promise<{ id: string }> }) {
  const { profile } = await requireAuth();
  const { id } = await params;

  const followUp = await getFollowUpById(id, profile);
  if (!followUp) notFound();

  const canManage = await canManageGuidance(profile);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Rehberlik" title={followUp.title} description={`${followUp.student?.full_name ?? "Bilinmeyen talebe"} — ${followUp.follow_up_date}`} />

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-medium">Durum</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={statusColors[followUp.status] ?? "outline"}>{statusLabels[followUp.status] ?? followUp.status}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-medium">Öğrenci</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">{followUp.student?.full_name ?? "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-medium">Atanan Kişi</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">{followUp.assigned_to_profile?.full_name ?? "—"}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Detay</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {followUp.description && (
            <div>
              <p className="text-xs text-muted-foreground">Açıklama</p>
              <p className="text-sm whitespace-pre-wrap">{followUp.description}</p>
            </div>
          )}
          {followUp.result_note && (
            <div>
              <p className="text-xs text-muted-foreground">Sonuç Notu</p>
              <p className="text-sm whitespace-pre-wrap">{followUp.result_note}</p>
            </div>
          )}
          {followUp.interview && (
            <div>
              <p className="text-xs text-muted-foreground">İlişkili Görüşme</p>
              <Link href={`/rehberlik/gorusmeler/${followUp.interview.id}`} className="text-sm font-medium text-[#093657] hover:underline">{followUp.interview.title}</Link>
            </div>
          )}
        </CardContent>
      </Card>

      {canManage && followUp.status === "planned" && (
        <div className="flex gap-3">
          <form action={completeFollowUpAction.bind(null, followUp.id) as unknown as (formData: FormData) => void}>
            <FormSubmitButton variant="default">
              <CheckCircle className="mr-1.5 size-4" /> Tamamlandı Olarak İşaretle
            </FormSubmitButton>
          </form>
          <form action={cancelFollowUpAction.bind(null, followUp.id) as unknown as (formData: FormData) => void}>
            <FormSubmitButton variant="destructive">
              <XCircle className="mr-1.5 size-4" /> İptal Et
            </FormSubmitButton>
          </form>
        </div>
      )}
    </div>
  );
}
