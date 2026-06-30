import Link from "next/link";
import { Plus, Megaphone } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth";
import { canCreateAnnouncements, canViewAnnouncements } from "@/lib/duyurular/permissions";
import { getAnnouncements } from "@/lib/duyurular/queries";
import { markAnnouncementNotificationsAsRead } from "@/lib/notifications/queries";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const roleLabels: Record<string, string> = { admin: "Admin", genel_mudur: "Genel Müdür", yonetim: "Yönetim", bolum_muduru: "Bölüm Müdürü", hoca: "Hoca", rehberlik: "Rehberlik" };

export default async function DuyurularPage() {
  const { profile } = await requireAuth();

  if (!canViewAnnouncements(profile)) {
    return <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Bu sayfaya erişim yetkiniz bulunmamaktadır.</div>;
  }

  const announcements = await getAnnouncements();
  const canCreate = canCreateAnnouncements(profile);
  await markAnnouncementNotificationsAsRead(profile.id);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Modül"
        title="Duyurular"
        description="Kurum içi duyuru yönetimi."
        actions={canCreate ? <Link href="/duyurular/yeni" className={cn(buttonVariants({ size: "sm" }))}><Plus className="mr-1.5 size-4" /> Yeni Duyuru</Link> : undefined}
      />

      {announcements.length === 0 ? (
        <EmptyState title="Henüz duyuru bulunmuyor." />
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <Link key={a.id} href={`/duyurular/${a.id}`} className="block rounded-lg border border-border bg-white p-4 transition-colors hover:border-[#093657]/30 hover:bg-muted/20">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Megaphone className="size-4 shrink-0 text-[#093657]" />
                    <h3 className="text-sm font-medium">{a.title}</h3>
                    {!a.is_published && <Badge variant="outline">Taslak</Badge>}
                  </div>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{a.content}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{new Date(a.created_at).toLocaleDateString("tr-TR")}</span>
                    {a.target_role && <Badge variant="secondary">{roleLabels[a.target_role] ?? a.target_role}</Badge>}
                    {a.creator && <span>— {a.creator.full_name}</span>}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
