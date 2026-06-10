import { HeartHandshake, ClipboardList, FileText, CalendarDays, Plus, BarChart3, Trash2 } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth";
import { canViewGuidance, canManageGuidance } from "@/lib/guidance/permissions";
import { getGuidanceDashboardData, getRecentInterviews, getUpcomingFollowUps, getActiveSurveys, getPlannedActivities } from "@/lib/guidance/queries";
import { deleteSurveyAction } from "@/lib/guidance/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const statusBadge: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  open: "default",
  followed: "secondary",
  closed: "outline",
  planned: "secondary",
  completed: "default",
  cancelled: "destructive",
};

const statusLabels: Record<string, string> = {
  open: "Açık",
  followed: "Takip Ediliyor",
  closed: "Kapalı",
  planned: "Planlandı",
  completed: "Tamamlandı",
  cancelled: "İptal",
};

export default async function RehberlikPage() {
  const { profile } = await requireAuth();

  if (!canViewGuidance(profile)) {
    return <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Bu sayfaya erişim yetkiniz bulunmamaktadır.</div>;
  }

  const [dashboardData, recentInterviews, upcomingFollowUps, activeSurveys, plannedActivities] = await Promise.all([
    getGuidanceDashboardData(profile),
    getRecentInterviews(profile, 5),
    getUpcomingFollowUps(profile, 5),
    getActiveSurveys(profile, 5),
    getPlannedActivities(profile, 5),
  ]);

  const canManage = canManageGuidance(profile);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Rehberlik" title="Rehberlik Paneli" description="Öğrenci görüşmeleri, takip planları, anketler ve etkinlikler." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Toplam Görüşme</CardDescription>
            <CardTitle className="text-2xl text-[#093657]">{dashboardData.total_interviews}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Açık Takip</CardDescription>
            <CardTitle className="text-2xl text-[#093657]">{dashboardData.open_follow_ups}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Bu Ay Görüşme</CardDescription>
            <CardTitle className="text-2xl text-[#093657]">{dashboardData.this_month_interviews}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Aktif Anket</CardDescription>
            <CardTitle className="text-2xl text-[#093657]">{dashboardData.active_surveys}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Planlanan Etkinlik</CardDescription>
            <CardTitle className="text-2xl text-[#093657]">{dashboardData.planned_activities}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Yaklaşan Takip</CardDescription>
            <CardTitle className="text-2xl text-[#093657]">{dashboardData.upcoming_follow_ups}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {canManage && (
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/rehberlik/gorusmeler/yeni" className={cn(buttonVariants({ size: "sm" }))}>
            <Plus className="mr-1.5 size-4" /> Yeni Görüşme
          </Link>
          <Link href="/rehberlik/takipler/yeni" className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}>
            <Plus className="mr-1.5 size-4" /> Yeni Takip
          </Link>
          <Link href="/rehberlik/anketler/yeni" className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}>
            <Plus className="mr-1.5 size-4" /> Yeni Anket
          </Link>
          <Link href="/rehberlik/etkinlikler/yeni" className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}>
            <Plus className="mr-1.5 size-4" /> Yeni Etkinlik
          </Link>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-3">
            <HeartHandshake className="size-5 text-[#093657]" />
            <div>
              <CardTitle className="text-sm">Son Görüşmeler</CardTitle>
              <CardDescription className="text-xs">En son eklenen 5 görüşme</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {recentInterviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">Henüz görüşme kaydı bulunmuyor.</p>
            ) : (
              <div className="space-y-2">
                {recentInterviews.map((i) => (
                  <div key={i.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <Link href={canManage ? `/rehberlik/gorusmeler/${i.id}` : "#"} className="text-sm font-medium hover:text-[#093657]">
                        {i.title}
                      </Link>
                      <p className="text-xs text-muted-foreground truncate">
                        {i.student?.full_name} — {i.interview_date}
                      </p>
                    </div>
                    <Badge variant={statusBadge[i.status] ?? "outline"} className="ml-2 shrink-0">
                      {statusLabels[i.status] ?? i.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-3">
            <ClipboardList className="size-5 text-[#093657]" />
            <div>
              <CardTitle className="text-sm">Yaklaşan Takipler</CardTitle>
              <CardDescription className="text-xs">Planlanmış takip tarihleri</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {upcomingFollowUps.length === 0 ? (
              <p className="text-sm text-muted-foreground">Henüz takip planı bulunmuyor.</p>
            ) : (
              <div className="space-y-2">
                {upcomingFollowUps.map((fu) => (
                  <div key={fu.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <Link href={canManage ? `/rehberlik/takipler/${fu.id}` : "#"} className="text-sm font-medium hover:text-[#093657]">
                        {fu.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {fu.student?.full_name} — {fu.follow_up_date}
                      </p>
                    </div>
                    {fu.assigned_to_profile && (
                      <span className="ml-2 shrink-0 text-xs text-muted-foreground">{fu.assigned_to_profile.full_name}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-3">
            <FileText className="size-5 text-[#093657]" />
            <div>
              <CardTitle className="text-sm">Aktif Anketler</CardTitle>
              <CardDescription className="text-xs">Devam eden anketler</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {activeSurveys.length === 0 ? (
              <p className="text-sm text-muted-foreground">Henüz aktif anket bulunmuyor.</p>
            ) : (
              <div className="space-y-2">
                {activeSurveys.map((s) => (
                  <div key={s.id} className="rounded-md border border-border px-3 py-2">
                    <div className="flex items-center justify-between">
                      <Link href={`/rehberlik/anketler/${s.id}`} className="text-sm font-medium hover:text-[#093657]">
                        {s.title}
                      </Link>
                      <Badge variant="default" className="ml-2 shrink-0">Aktif</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{s.response_count} cevap</p>
                    {canManage && (
                      <div className="mt-2 flex items-center gap-2 border-t border-border pt-2">
                        <Link href={`/rehberlik/anketler/${s.id}`} className="text-xs font-medium text-[#093657] hover:underline">Önizle</Link>
                        <Link href={`/rehberlik/anketler/${s.id}/sonuclar`} className="text-xs font-medium text-[#093657] hover:underline"><BarChart3 className="mr-0.5 inline-block size-3" /> Sonuçlar</Link>
                        <form action={deleteSurveyAction.bind(null, s.id) as unknown as (formData: FormData) => void} className="ml-auto">
                          <button type="submit" className="text-xs font-medium text-red-600 hover:underline"><Trash2 className="mr-0.5 inline-block size-3" /> Kaldır</button>
                        </form>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-3">
            <CalendarDays className="size-5 text-[#093657]" />
            <div>
              <CardTitle className="text-sm">Planlanan Etkinlikler</CardTitle>
              <CardDescription className="text-xs">Gelecek etkinlikler</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {plannedActivities.length === 0 ? (
              <p className="text-sm text-muted-foreground">Henüz planlanan etkinlik bulunmuyor.</p>
            ) : (
              <div className="space-y-2">
                {plannedActivities.map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <Link href={canManage ? `/rehberlik/etkinlikler/${a.id}` : "#"} className="text-sm font-medium hover:text-[#093657]">
                        {a.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">{a.activity_date}{a.location ? ` — ${a.location}` : ""}</p>
                    </div>
                    <span className="ml-2 shrink-0 text-xs text-muted-foreground">{a.participant_count} katılımcı</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
