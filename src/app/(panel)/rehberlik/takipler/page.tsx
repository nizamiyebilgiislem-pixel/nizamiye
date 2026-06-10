import Link from "next/link";
import { Plus } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth";
import { canViewGuidance, canManageGuidance } from "@/lib/guidance/permissions";
import { getFollowUps } from "@/lib/guidance/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const statusLabels: Record<string, string> = { planned: "Planlandı", completed: "Tamamlandı", cancelled: "İptal" };
const statusColors: Record<string, "default" | "secondary" | "outline" | "destructive"> = { planned: "secondary", completed: "default", cancelled: "destructive" };

type Props = { searchParams: Promise<{ status?: string }> };

export default async function TakiplerPage({ searchParams }: Props) {
  const { profile } = await requireAuth();
  const params = await searchParams;

  if (!canViewGuidance(profile)) {
    return <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Bu sayfaya erişim yetkiniz bulunmamaktadır.</div>;
  }

  const followUps = await getFollowUps(profile, params.status ? { status: params.status } : undefined);
  const canManage = await canManageGuidance(profile);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Rehberlik" title="Takip Planları" description="Planlanan ve tamamlanan takipler." actions={canManage ? <Link href="/rehberlik/takipler/yeni" className={cn(buttonVariants({ size: "sm" }))}><Plus className="mr-1.5 size-4" /> Yeni Takip</Link> : undefined} />

      <div className="flex flex-wrap gap-2">
        {["", "planned", "completed", "cancelled"].map((s) => (
          <Link key={s} href={s ? `/rehberlik/takipler?status=${s}` : "/rehberlik/takipler"}
            className={cn("rounded-md px-3 py-1.5 text-xs font-medium transition-colors", params.status === s || (!params.status && !s) ? "bg-[#093657] text-white" : "bg-muted text-muted-foreground hover:bg-muted/80")}>
            {s ? statusLabels[s] ?? s : "Tümü"}
          </Link>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Talebe</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Takip Tarihi</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Başlık</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Atanan</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Durum</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Sonuç</th>
                  {canManage && <th className="px-4 py-3 text-right font-medium text-muted-foreground">İşlem</th>}
                </tr>
              </thead>
              <tbody>
                {followUps.length === 0 ? (
                  <tr><td colSpan={canManage ? 7 : 6} className="px-4 py-8 text-center text-muted-foreground">Hiç takip bulunamadı.</td></tr>
                ) : followUps.map((fu) => (
                  <tr key={fu.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3">{fu.student?.full_name ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{fu.follow_up_date}</td>
                    <td className="px-4 py-3 font-medium">{fu.title}</td>
                    <td className="px-4 py-3 text-muted-foreground">{fu.assigned_to_profile?.full_name ?? "—"}</td>
                    <td className="px-4 py-3"><Badge variant={statusColors[fu.status] ?? "outline"}>{statusLabels[fu.status] ?? fu.status}</Badge></td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">{fu.result_note ?? "—"}</td>
                    {canManage && (
                      <td className="px-4 py-3 text-right">
                        <Link href={`/rehberlik/takipler/${fu.id}`} className="text-xs font-medium text-[#093657] hover:underline">Detay</Link>
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
