import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth";
import { canManageGuidance, canViewPrivateNotes } from "@/lib/guidance/permissions";
import { getInterviewById } from "@/lib/guidance/queries";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const interviewTypeLabels: Record<string, string> = {
  individual: "Bireysel", group: "Grup", parent: "Veli", emergency: "Acil", follow_up: "Takip",
};

export default async function GorusmeDetayPage({ params }: { params: Promise<{ id: string }> }) {
  const { profile } = await requireAuth();
  const { id } = await params;

  const interview = await getInterviewById(id, profile);
  if (!interview) notFound();

  const canManage = canManageGuidance(profile);
  const canViewPrivate = canViewPrivateNotes(profile);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Rehberlik" title={interview.title} description={`${interview.student?.full_name ?? "Bilinmeyen talebe"} — ${interview.interview_date}`} actions={canManage ? <Link href={`/rehberlik/gorusmeler/${id}/duzenle`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}><Pencil className="mr-1.5 size-4" /> Düzenle</Link> : undefined} />

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-medium">Durum</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={interview.status === "open" ? "default" : interview.status === "followed" ? "secondary" : "outline"}>
              {interview.status === "open" ? "Açık" : interview.status === "followed" ? "Takip Ediliyor" : "Kapalı"}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-medium">Görüşme Türü</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">{interviewTypeLabels[interview.interview_type] ?? interview.interview_type}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-medium">Görünürlük</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">
              {interview.visibility === "private" ? "Özel" : interview.visibility === "summary" ? "Sadece Özet" : "Paylaşıldı"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Görüşme Detayı</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground">Öğrenci</p>
              <p className="text-sm font-medium">{interview.student?.full_name ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Rehberlik Hocası</p>
              <p className="text-sm font-medium">{interview.counselor?.full_name ?? "—"}</p>
            </div>
            {interview.summary && (
              <div>
                <p className="text-xs text-muted-foreground">Özet</p>
                <p className="text-sm">{interview.summary}</p>
              </div>
            )}
            {interview.action_plan && (
              <div>
                <p className="text-xs text-muted-foreground">Aksiyon Planı</p>
                <p className="text-sm whitespace-pre-wrap">{interview.action_plan}</p>
              </div>
            )}
            {interview.next_follow_up_date && (
              <div>
                <p className="text-xs text-muted-foreground">Sonraki Takip Tarihi</p>
                <p className="text-sm font-medium">{interview.next_follow_up_date}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {canViewPrivate && interview.private_notes && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <span className="inline-block size-2 rounded-full bg-amber-400" />
                Özel Notlar
              </CardTitle>
              <CardDescription className="text-xs">Sadece yetkili kullanıcılar görebilir</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{interview.private_notes}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Durum Değerlendirmesi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Duygusal Durum", value: interview.emotional_state },
              { label: "Akademik Durum", value: interview.academic_state },
              { label: "Sosyal Durum", value: interview.social_state },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-sm">{item.value || "—"}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
