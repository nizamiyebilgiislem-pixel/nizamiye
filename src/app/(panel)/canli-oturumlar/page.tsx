import Link from "next/link";
import { Plus, Video, Clock, CheckCircle2, XCircle, Calendar } from "lucide-react";

import { CopyMeetingLinkButton } from "@/components/live-sessions/copy-meeting-link-button";
import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth";
import { canCreateSession } from "@/lib/live-sessions/permissions";
import { getSessions, getSessionCounts } from "@/lib/live-sessions/queries";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const sessionTypeLabels: Record<string, string> = {
  ogretmen_toplantisi: "Öğretmen Toplantısı",
  konuk_semineri: "Konuk Semineri",
  bolum_toplantisi: "Bölüm Toplantısı",
  veli_gorusmesi: "Veli Görüşmesi",
  ozel_etkinlik: "Özel Etkinlik",
};

const statusLabels: Record<string, string> = {
  planned: "Planlandı",
  active: "Aktif",
  completed: "Tamamlandı",
  cancelled: "İptal",
};

const statusColors: Record<string, string> = {
  planned: "border-blue-200 bg-blue-50 text-blue-700",
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  completed: "border-gray-200 bg-gray-50 text-gray-600",
  cancelled: "border-red-200 bg-red-50 text-red-700",
};

export default async function CanliOturumlarPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { profile } = await requireAuth();
  const params = await searchParams;
  const activeTab = params.tab ?? "hepsi";

  const sessions = await getSessions(profile);
  const counts = await getSessionCounts(profile);
  const canCreate = canCreateSession(profile);

  const now = new Date().toISOString();

  let filteredSessions = sessions;
  if (activeTab === "upcoming") {
    filteredSessions = sessions.filter((s) => s.status === "planned" || s.status === "active");
  } else if (activeTab === "active") {
    filteredSessions = sessions.filter((s) => s.status === "active");
  } else if (activeTab === "my") {
    filteredSessions = sessions.filter((s) => s.created_by === profile.id);
  } else if (activeTab === "completed") {
    filteredSessions = sessions.filter((s) => s.status === "completed");
  } else if (activeTab === "cancelled") {
    filteredSessions = sessions.filter((s) => s.status === "cancelled");
  }

  const tabs = [
    { key: "hepsi", label: "Hepsi", count: counts.total },
    { key: "upcoming", label: "Yaklaşan", count: counts.upcoming },
    { key: "active", label: "Aktif", count: counts.active },
    { key: "my", label: "Benimkiler", count: counts.mySessions },
    { key: "completed", label: "Tamamlanan", count: counts.completed },
    { key: "cancelled", label: "İptal", count: counts.cancelled },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Modül"
        title="Canlı Oturumlar"
        description="Kurum içi Jitsi toplantılarını planlayın ve yönetin."
        actions={
          canCreate ? (
            <div className="flex gap-2">
              <Link href="/canli-oturumlar/yeni" className={cn(buttonVariants({ size: "sm" }))}>
                <Plus className="mr-1.5 size-4" /> Yeni Oturum
              </Link>
            </div>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <DashboardStatCard icon={<Clock className="size-4" />} label="Yaklaşan" value={counts.upcoming} color="text-blue-700" bgColor="bg-blue-50" />
        <DashboardStatCard icon={<Video className="size-4" />} label="Aktif" value={counts.active} color="text-emerald-700" bgColor="bg-emerald-50" />
        <DashboardStatCard icon={<CheckCircle2 className="size-4" />} label="Tamamlanan" value={counts.completed} color="text-green-700" bgColor="bg-green-50" />
        <DashboardStatCard icon={<XCircle className="size-4" />} label="İptal" value={counts.cancelled} color="text-red-700" bgColor="bg-red-50" />
        <DashboardStatCard icon={<Calendar className="size-4" />} label="Toplam" value={counts.total} color="text-[#093657]" bgColor="bg-[#093657]/5" />
      </div>

      <div className="flex flex-wrap items-center gap-1 border-b border-border">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.key === "hepsi" ? "/canli-oturumlar" : `/canli-oturumlar?tab=${tab.key}`}
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

      {filteredSessions.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">Henüz oturum bulunmuyor.</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredSessions.map((s) => {
            const isUpcoming = new Date(s.start_time) > new Date(now) && s.status !== "cancelled" && s.status !== "completed";
            const isLive = s.status === "active";

            return (
              <div
                key={s.id}
                className="rounded-lg border border-border bg-white p-4 transition-colors hover:border-[#093657]/30 hover:bg-muted/20"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      {isLive && <span className="size-2 shrink-0 rounded-full bg-emerald-500" title="Aktif" />}
                      <Link href={`/canli-oturumlar/${s.id}`} className="truncate text-sm font-medium text-[#093657] hover:underline">
                        {s.title}
                      </Link>
                      <span className={cn("inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium", statusColors[s.status] ?? "")}>
                        {statusLabels[s.status] ?? s.status}
                      </span>
                      <span className="inline-flex items-center rounded-md border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                        {sessionTypeLabels[s.session_type] ?? s.session_type}
                      </span>
                    </div>
                    {s.description && (
                      <p className="line-clamp-1 text-sm text-muted-foreground">{s.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                      <span>{new Date(s.start_time).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" })}</span>
                      {s.creator && <span>Oluşturan: {s.creator.full_name}</span>}
                      {s.department && <span className="rounded bg-muted/50 px-1 py-0.5">{s.department.name}</span>}
                      <span>{s.participant_count}/{s.max_participants} katılımcı</span>
                      {isUpcoming && (
                        <span className="font-medium text-[#093657]">Katıl</span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <CopyMeetingLinkButton sessionId={s.id} />
                    <Link href={`/canli-oturumlar/${s.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                      Detay
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DashboardStatCard({
  icon,
  label,
  value,
  color,
  bgColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  bgColor: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-3">
        <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", bgColor)}>
          <div className={color}>{icon}</div>
        </div>
        <div className="min-w-0">
          <p className={cn("text-lg font-bold leading-tight", color)}>{value}</p>
          <p className="truncate text-[11px] text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
