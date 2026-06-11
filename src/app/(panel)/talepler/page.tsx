import Link from "next/link";
import { Plus, MessageSquare } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth";
import { canViewTalepler, canCreateTalep } from "@/lib/talepler/permissions";
import { getTalepler, getTalepCounts, statusLabels, priorityLabels } from "@/lib/talepler/queries";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
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

export default async function TaleplerPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; status?: string }>;
}) {
  const { profile } = await requireAuth();
  const params = await searchParams;
  const activeTab = params.tab ?? "hepsi";

  if (!canViewTalepler(profile)) {
    return <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Bu sayfaya erişim yetkiniz bulunmamaktadır.</div>;
  }

  const { data: talepler } = await getTalepler(profile);
  const counts = await getTalepCounts(profile);
  const canCreate = canCreateTalep(profile);

  let filteredTalepler = talepler;

  if (activeTab === "gelen") {
    filteredTalepler = talepler.filter((t) => t.requested_by !== profile.id);
  } else if (activeTab === "giden") {
    filteredTalepler = talepler.filter((t) => t.requested_by === profile.id);
  } else if (activeTab === "acil") {
    filteredTalepler = talepler.filter((t) => t.priority === "acil");
  } else if (activeTab !== "hepsi") {
    filteredTalepler = talepler.filter((t) => t.status === activeTab);
  }

  const tabs = [
    { key: "hepsi", label: "Hepsi", count: counts.total },
    { key: "gelen", label: "Gelen Talepler", count: counts.gelen },
    { key: "giden", label: "Giden Talepler", count: counts.giden },
    { key: "bekliyor", label: "Bekleyen", count: counts.bekliyor },
    { key: "acil", label: "Acil", count: counts.acil },
    { key: "onaylandi", label: "Onaylanan", count: counts.onaylandi },
    { key: "reddedildi", label: "Reddedilen", count: counts.reddedildi },
    { key: "tamamlandi", label: "Tamamlanan", count: counts.tamamlandi },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Modül"
        title="Talep Yönetimi"
        description="Birimler arası talep ve istek takibi."
        actions={
          canCreate ? (
            <div className="flex gap-2">
              <Link href="/talepler/yeni" className={cn(buttonVariants({ size: "sm" }))}>
                <Plus className="mr-1.5 size-4" /> Yeni Talep
              </Link>
            </div>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Bekleyen" value={counts.bekliyor} color="text-yellow-700" />
        <StatCard label="İşleme Alınan" value={counts.isleme_alindi + counts.incelemede} color="text-blue-700" />
        <StatCard label="Tamamlanan" value={counts.tamamlandi} color="text-gray-700" />
        <StatCard label="Acil" value={counts.acil} color="text-red-700" />
        <StatCard label="Toplam" value={counts.total} color="text-[#093657]" />
      </div>

      <div className="flex flex-wrap items-center gap-1 border-b border-border">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.key === "hepsi" ? "/talepler" : `/talepler?tab=${tab.key}`}
            className={cn(
              "inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-medium transition-colors",
              activeTab === tab.key
                ? "border-[#093657] text-[#093657]"
                : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
            )}
          >
            {tab.label}
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold">{tab.count}</span>
          </Link>
        ))}
      </div>

      {filteredTalepler.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">Henüz talep bulunmuyor.</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTalepler.map((t) => {
            const sc = statusColors[t.status] ?? "";
            return (
              <Link
                key={t.id}
                href={`/talepler/${t.id}`}
                className="block rounded-lg border border-border bg-white p-4 transition-colors hover:border-[#093657]/30 hover:bg-muted/20"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      {t.priority === "acil" && (
                        <span className="size-2 shrink-0 rounded-full bg-red-500" title="Acil" />
                      )}
                      <MessageSquare className="size-4 shrink-0 text-[#093657]" />
                      <h3 className="truncate text-sm font-medium">{t.title}</h3>
                      <span className={cn("inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium", sc)}>
                        {statusLabels[t.status] ?? t.status}
                      </span>
                    </div>
                    <p className="line-clamp-1 text-sm text-muted-foreground">{t.description}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                      <span>{new Date(t.created_at).toLocaleDateString("tr-TR")}</span>
                      <span className="text-nowrap">No: {t.id.slice(0, 8)}</span>
                      {t.requester && <span>{t.requester.full_name}</span>}
                      <span className="rounded bg-muted/50 px-1 py-0.5">{priorityLabels[t.priority] ?? t.priority}</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Card>
      <CardContent className="p-3 text-center">
        <p className={cn("text-lg font-bold", color)}>{value}</p>
        <p className="text-[11px] text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
