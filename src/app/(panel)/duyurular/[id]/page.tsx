import { notFound } from "next/navigation";
import Link from "next/link";
import { Pencil, Trash2, ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth";
import { canViewAnnouncements, canManageAnnouncements } from "@/lib/duyurular/permissions";
import { getAnnouncementById } from "@/lib/duyurular/queries";
import { deleteAnnouncementAction } from "@/lib/duyurular/actions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { cn } from "@/lib/utils";

const roleLabels: Record<string, string> = { admin: "Admin", genel_mudur: "Genel Müdür", bolum_muduru: "Bölüm Müdürü", hoca: "Hoca" };

export default async function DuyuruDetayPage({ params }: { params: Promise<{ id: string }> }) {
  const { profile } = await requireAuth();
  const { id } = await params;

  if (!canViewAnnouncements(profile)) {
    return <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Bu sayfaya erişim yetkiniz bulunmamaktadır.</div>;
  }

  const announcement = await getAnnouncementById(id);
  if (!announcement) notFound();

  const canManage = canManageAnnouncements(profile);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Duyurular"
        title={announcement.title}
        actions={canManage ? <div className="flex gap-2"><Link href={`/duyurular/${id}/duzenle`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}><Pencil className="mr-1.5 size-4" /> Düzenle</Link><form action={deleteAnnouncementAction.bind(null, id) as unknown as (formData: FormData) => void}><FormSubmitButton variant="destructive" size="sm"><Trash2 className="mr-1.5 size-4" /> Sil</FormSubmitButton></form></div> : undefined}
      />

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{new Date(announcement.created_at).toLocaleDateString("tr-TR", { dateStyle: "long", timeStyle: "short" })}</span>
            {announcement.target_role && <Badge variant="secondary">{roleLabels[announcement.target_role] ?? announcement.target_role}</Badge>}
            {!announcement.is_published && <Badge variant="outline">Taslak</Badge>}
            {announcement.creator && <span>— {announcement.creator.full_name}</span>}
          </div>

          <div className="whitespace-pre-wrap text-sm leading-relaxed">{announcement.content}</div>
        </CardContent>
      </Card>

      <Link href="/duyurular" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
        <ArrowLeft className="mr-1.5 size-4" /> Tüm Duyurular
      </Link>
    </div>
  );
}
