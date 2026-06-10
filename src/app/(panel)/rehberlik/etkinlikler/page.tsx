import Link from "next/link";
import { Plus } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth";
import { canViewGuidance, canManageGuidance } from "@/lib/guidance/permissions";
import { getActivities } from "@/lib/guidance/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const typeLabels: Record<string, string> = { trip: "Gezi", seminar: "Seminer", meeting: "Toplantı", sports: "Spor", cultural: "Kültürel", activity: "Aktivite" };
const statusLabels: Record<string, string> = { planned: "Planlandı", completed: "Tamamlandı", cancelled: "İptal" };
const statusColors: Record<string, "default" | "secondary" | "destructive"> = { planned: "secondary", completed: "default", cancelled: "destructive" };

type Props = { searchParams: Promise<{ status?: string; activity_type?: string }> };

export default async function EtkinliklerPage({ searchParams }: Props) {
  const { profile } = await requireAuth();
  const params = await searchParams;

  if (!canViewGuidance(profile)) {
    return <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Bu sayfaya erişim yetkiniz bulunmamaktadır.</div>;
  }

  const activities = await getActivities(profile, params.status ? { status: params.status } : undefined);
  const canManage = canManageGuidance(profile);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Rehberlik" title="Etkinlikler" description="Gezi, seminer ve aktivite planları." actions={canManage ? <Link href="/rehberlik/etkinlikler/yeni" className={cn(buttonVariants({ size: "sm" }))}><Plus className="mr-1.5 size-4" /> Yeni Etkinlik</Link> : undefined} />

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Başlık</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tür</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tarih</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Yer</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Sorumlu</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Durum</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Katılımcı</th>
                  {canManage && <th className="px-4 py-3 text-right font-medium text-muted-foreground">İşlem</th>}
                </tr>
              </thead>
              <tbody>
                {activities.length === 0 ? (
                  <tr><td colSpan={canManage ? 8 : 7} className="px-4 py-8 text-center text-muted-foreground">Hiç etkinlik bulunamadı.</td></tr>
                ) : activities.map((a) => (
                  <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{a.title}</td>
                    <td className="px-4 py-3"><Badge variant="secondary">{typeLabels[a.activity_type] ?? a.activity_type}</Badge></td>
                    <td className="px-4 py-3 text-muted-foreground">{a.activity_date}</td>
                    <td className="px-4 py-3 text-muted-foreground">{a.location ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{a.responsible_profile?.full_name ?? "—"}</td>
                    <td className="px-4 py-3"><Badge variant={statusColors[a.status] ?? "outline"}>{statusLabels[a.status] ?? a.status}</Badge></td>
                    <td className="px-4 py-3 text-muted-foreground">{a.participant_count}</td>
                    {canManage && (
                      <td className="px-4 py-3 text-right">
                        <Link href={`/rehberlik/etkinlikler/${a.id}`} className="text-xs font-medium text-[#093657] hover:underline">Detay</Link>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
