import Link from "next/link";
import { Plus } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { canViewGuidance, canManageGuidance } from "@/lib/guidance/permissions";
import { getInterviews } from "@/lib/guidance/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { cn } from "@/lib/utils";

const interviewTypeLabels: Record<string, string> = {
  individual: "Bireysel", group: "Grup", parent: "Veli", emergency: "Acil", follow_up: "Takip",
};

const statusLabels: Record<string, string> = {
  open: "AÃ§Ä±k", followed: "Takip Ediliyor", closed: "KapalÄ±",
};

const statusColors: Record<string, "default" | "secondary" | "outline"> = {
  open: "default", followed: "secondary", closed: "outline",
};

type Props = {
  searchParams: Promise<{ search?: string; status?: string; interview_type?: string; counselor_id?: string; date_from?: string; date_to?: string }>;
};

export default async function GorusmelerPage({ searchParams }: Props) {
  const { profile } = await requireAuth();
  const params = await searchParams;

  if (!canViewGuidance(profile)) {
    return <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Bu sayfaya eriÅŸim yetkiniz bulunmamaktadÄ±r.</div>;
  }

  const interviews = await getInterviews(profile, params);
  const canManage = await canManageGuidance(profile);
  const supabase = await createSupabaseServerClient();
  const { data: counselors } = await supabase.from("profiles").select("id, full_name").in("role", ["admin", "genel_mudur", "rehberlik"]).eq("is_active", true).order("full_name");

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Rehberlik" title="GÃ¶rÃ¼ÅŸmeler" description="TÃ¼m rehberlik gÃ¶rÃ¼ÅŸmeleri." actions={canManage ? <Link href="/rehberlik/gorusmeler/yeni" className={cn(buttonVariants({ size: "sm" }))}><Plus className="mr-1.5 size-4" /> Yeni GÃ¶rÃ¼ÅŸme</Link> : undefined} />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Filtreler</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-wrap items-end gap-3">
            <label className="grid gap-1 text-xs font-medium">
              Arama
              <Input name="search" defaultValue={params.search ?? ""} placeholder="BaÅŸlÄ±k veya Ã¶zet..." />
            </label>
            <label className="grid gap-1 text-xs font-medium">
              Durum
              <NativeSelect name="status" defaultValue={params.status ?? ""} className="h-9 rounded-md border border-input bg-background px-2.5 text-sm outline-none focus:border-[#093657]">
                <option value="">TÃ¼mÃ¼</option>
                <option value="open">AÃ§Ä±k</option>
                <option value="followed">Takip Ediliyor</option>
                <option value="closed">KapalÄ±</option>
              </NativeSelect>
            </label>
            <label className="grid gap-1 text-xs font-medium">
              TÃ¼r
              <NativeSelect name="interview_type" defaultValue={params.interview_type ?? ""} className="h-9 rounded-md border border-input bg-background px-2.5 text-sm outline-none focus:border-[#093657]">
                <option value="">TÃ¼mÃ¼</option>
                <option value="individual">Bireysel</option>
                <option value="group">Grup</option>
                <option value="parent">Veli</option>
                <option value="emergency">Acil</option>
                <option value="follow_up">Takip</option>
              </NativeSelect>
            </label>
            <label className="grid gap-1 text-xs font-medium">
              Rehberlik
              <NativeSelect name="counselor_id" defaultValue={params.counselor_id ?? ""} className="h-9 rounded-md border border-input bg-background px-2.5 text-sm outline-none focus:border-[#093657]">
                <option value="">TÃ¼mÃ¼</option>
                {(counselors ?? []).map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
              </NativeSelect>
            </label>
            <label className="grid gap-1 text-xs font-medium">
              BaÅŸlangÄ±Ã§
              <Input name="date_from" type="date" defaultValue={params.date_from ?? ""} />
            </label>
            <label className="grid gap-1 text-xs font-medium">
              BitiÅŸ
              <Input name="date_to" type="date" defaultValue={params.date_to ?? ""} />
            </label>
            <Button type="submit">Filtrele</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Talebe</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tarih</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">TÃ¼r</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">BaÅŸlÄ±k</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Durum</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Takip Tarihi</th>
                  {canManage && <th className="px-4 py-3 text-right font-medium text-muted-foreground">Ä°ÅŸlem</th>}
                </tr>
              </thead>
              <tbody>
                {interviews.length === 0 ? (
                  <tr><td colSpan={canManage ? 7 : 6} className="px-4 py-8 text-center text-muted-foreground">HiÃ§ gÃ¶rÃ¼ÅŸme bulunamadÄ±.</td></tr>
                ) : interviews.map((i) => (
                  <tr key={i.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3">{i.student?.full_name ?? "â€”"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{i.interview_date}</td>
                    <td className="px-4 py-3"><Badge variant="secondary">{interviewTypeLabels[i.interview_type] ?? i.interview_type}</Badge></td>
                    <td className="px-4 py-3 font-medium">{i.title}</td>
                    <td className="px-4 py-3"><Badge variant={statusColors[i.status] ?? "outline"}>{statusLabels[i.status] ?? i.status}</Badge></td>
                    <td className="px-4 py-3 text-muted-foreground">{i.next_follow_up_date ?? "â€”"}</td>
                    {canManage && (
                      <td className="px-4 py-3 text-right">
                        <Link href={`/rehberlik/gorusmeler/${i.id}`} className="text-xs font-medium text-[#093657] hover:underline">Detay</Link>
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
