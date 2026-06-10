import Link from "next/link";
import { Plus } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth";
import { canViewGuidance, canManageGuidance } from "@/lib/guidance/permissions";
import { getSurveys } from "@/lib/guidance/queries";
import { closeSurveyAction } from "@/lib/guidance/actions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const statusLabels: Record<string, string> = { draft: "Taslak", active: "Aktif", closed: "Kapalı" };
const statusColors: Record<string, "default" | "secondary" | "outline"> = { draft: "outline", active: "default", closed: "secondary" };
const scopeLabels: Record<string, string> = { all_students: "Tüm Öğrenciler", department: "Bölüm", class: "Sınıf" };

export default async function AnketlerPage() {
  const { profile } = await requireAuth();
  if (!canViewGuidance(profile)) {
    return <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Bu sayfaya erişim yetkiniz bulunmamaktadır.</div>;
  }

  const surveys = await getSurveys(profile);
  const canManage = canManageGuidance(profile);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Rehberlik" title="Anketler" description="Öğrenci anketleri ve sonuçları." actions={canManage ? <Link href="/rehberlik/anketler/yeni" className={cn(buttonVariants({ size: "sm" }))}><Plus className="mr-1.5 size-4" /> Yeni Anket</Link> : undefined} />

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Anket Adı</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Hedef</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Durum</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Soru</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cevap</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Başlangıç</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Bitiş</th>
                  {canManage && <th className="px-4 py-3 text-right font-medium text-muted-foreground">İşlem</th>}
                </tr>
              </thead>
              <tbody>
                {surveys.length === 0 ? (
                  <tr><td colSpan={canManage ? 8 : 7} className="px-4 py-8 text-center text-muted-foreground">Hiç anket bulunamadı.</td></tr>
                ) : surveys.map((s) => (
                  <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{s.title}</td>
                    <td className="px-4 py-3"><Badge variant="secondary">{scopeLabels[s.target_scope] ?? s.target_scope}</Badge></td>
                    <td className="px-4 py-3"><Badge variant={statusColors[s.status] ?? "outline"}>{statusLabels[s.status] ?? s.status}</Badge></td>
                    <td className="px-4 py-3 text-muted-foreground">{s.question_count}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.response_count}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.starts_at ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.ends_at ?? "—"}</td>
                    {canManage && (
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/rehberlik/anketler/${s.id}`} className="text-xs font-medium text-[#093657] hover:underline">Detay</Link>
                          {s.status === "active" && (
                            <form action={closeSurveyAction.bind(null, s.id) as unknown as (formData: FormData) => void}>
                              <button type="submit" className="text-xs font-medium text-red-600 hover:underline">Kapat</button>
                            </form>
                          )}
                          {s.status !== "draft" && (
                            <Link href={`/rehberlik/anketler/${s.id}/sonuclar`} className="text-xs font-medium text-[#093657] hover:underline">Sonuçlar</Link>
                          )}
                        </div>
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
