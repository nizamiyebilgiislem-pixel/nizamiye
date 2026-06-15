import Link from "next/link";
import { CalendarClock, ClipboardList, HeartHandshake, Plus, Users } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getGuidanceDashboardData, getRecentInterviews, getUpcomingFollowUps } from "@/lib/guidance/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProfileRow } from "@/types/database";

export async function GuidanceDashboard({ profile }: { profile: ProfileRow }) {
  const [dashboardData, recentInterviews, upcomingFollowUps, activeStudentCount, todayFollowUpCount] = await Promise.all([
    getGuidanceDashboardData(profile),
    getRecentInterviews(profile, 5),
    getUpcomingFollowUps(profile, 5),
    getActiveStudentCount(),
    getTodayFollowUpCount(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Rehberlik"
        title="Yönetim Paneli"
        description="Tüm öğrencileri görüntüleyin, rehberlik kayıtlarını yönetin ve takipleri izleyin."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Users} label="Aktif Talebe" value={activeStudentCount} />
        <MetricCard icon={HeartHandshake} label="Toplam Görüşme" value={dashboardData.total_interviews} />
        <MetricCard icon={ClipboardList} label="Açık Takip" value={dashboardData.open_follow_ups} />
        <MetricCard icon={CalendarClock} label="Bugünkü Takip" value={todayFollowUpCount} />
      </div>

      <Card className="border-[#093657]/10 bg-white">
        <CardContent className="flex items-center justify-between gap-4 p-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Hızlı İşlem</p>
            <p className="mt-1 text-sm font-semibold text-[#093657]">Yeni rehberlik kaydı oluşturun</p>
          </div>
          <Link href="/rehberlik/gorusmeler/yeni" className="inline-flex items-center gap-1.5 rounded-md bg-[#093657] px-3 py-2 text-xs font-medium text-white hover:bg-[#093657]/90">
            <Plus className="size-4" aria-hidden />
            Yeni Görüşme
          </Link>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <ListCard
          title="Son Görüşmeler"
          description="En son eklenen 5 rehberlik kaydı"
          items={recentInterviews.map((item) => ({
            title: item.title,
            subtitle: item.student?.full_name ?? "Bilinmeyen talebe",
            meta: item.interview_date,
            href: `/rehberlik/gorusmeler/${item.id}`,
          }))}
        />

        <ListCard
          title="Yaklaşan Takipler"
          description="Planlanmış takipler"
          items={upcomingFollowUps.map((item) => ({
            title: item.title,
            subtitle: item.student?.full_name ?? "Bilinmeyen talebe",
            meta: item.follow_up_date,
            href: `/rehberlik/takipler/${item.id}`,
          }))}
        />
      </div>
    </div>
  );
}

async function getActiveStudentCount() {
  const supabase = await createSupabaseServerClient();
  const { count } = await supabase.from("students").select("id", { count: "exact", head: true }).eq("status", "active");
  return count ?? 0;
}

async function getTodayFollowUpCount() {
  const supabase = await createSupabaseServerClient();
  const today = new Date().toISOString().split("T")[0];
  const { count } = await supabase
    .from("guidance_follow_ups")
    .select("id", { count: "exact", head: true })
    .eq("status", "planned")
    .eq("follow_up_date", today);
  return count ?? 0;
}

function MetricCard({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number }) {
  return (
    <Card className="border-[#e5e7eb] bg-white">
      <CardContent className="flex items-center gap-2.5 p-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-[#eaf1f6]">
          <Icon className="size-4 text-[#093657]" aria-hidden />
        </div>
        <div className="flex flex-1 items-center justify-between gap-2">
          <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
          <p className="text-sm font-semibold text-[#093657]">{value.toLocaleString("tr-TR")}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ListCard({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: Array<{ title: string; subtitle: string; meta: string; href: string }>;
}) {
  return (
    <Card className="bg-white">
      <CardHeader className="border-b border-border pb-3">
        <CardTitle className="text-sm">{title}</CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {items.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">Kayıt bulunamadı.</p>
        ) : (
          <div className="divide-y divide-border">
            {items.map((item) => (
              <Link key={`${item.href}-${item.title}`} href={item.href} className="block px-4 py-3 hover:bg-[#f8fafc]">
                <p className="text-sm font-medium text-[#093657]">{item.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{item.subtitle}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.meta}</p>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
