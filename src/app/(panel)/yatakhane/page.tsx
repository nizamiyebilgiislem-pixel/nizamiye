import Link from "next/link";
import { redirect } from "next/navigation";

import { DormitoryDashboardCard } from "@/components/dormitory/dormitory-dashboard-card";
import { DormitoryOccupancyBars } from "@/components/dormitory/dormitory-occupancy-bars";
import { DormitorySummaryGrid } from "@/components/dormitory/dormitory-summary-grid";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { canManageDormitories, canViewDormitoryModule } from "@/lib/dormitory/permissions";
import { getDormitoryDashboard, getDormitoriesForProfile } from "@/lib/dormitory/queries";
import { requireAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export default async function DormitoryHomePage() {
  const { profile } = await requireAuth();
  if (!canViewDormitoryModule(profile)) {
    redirect("/veli");
  }

  const [dashboard, dormitories] = await Promise.all([getDormitoryDashboard(profile), getDormitoriesForProfile(profile)]);
  const canManage = canManageDormitories(profile);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Yatakhane"
        title="Yatakhane Yönetimi"
        description="Yatakhane, kat, oda, yatak ve talebe yerleşim durumunu yönetim odaklı tek ekranda izleyin."
      />

      <DormitoryDashboardCard dashboard={dashboard} />

      <section className="grid gap-4 xl:grid-cols-2">
        <DormitoryOccupancyBars
          title="Yatakhane doluluk grafiği"
          items={dormitories.map((dormitory) => {
            const occupied = dormitory.beds.filter((bed) => bed.is_active && bed.assignment?.status === "active").length;
            const total = Math.max(dormitory.beds.length, 1);
            return {
              label: dormitory.name,
              percent: Math.round((occupied / total) * 10000) / 100,
              detail: `${occupied} / ${total} yatak`,
            };
          })}
        />
        <DormitoryOccupancyBars
          title="Bölümlere göre yatakhane yerleşimi"
          items={dashboard.departmentDistribution.map((item) => ({
            label: item.name,
            percent: item.percent,
            detail: `${item.occupied} / ${item.total} talebe`,
          }))}
        />
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[#093657]">Yatakhaneler</h2>
            <p className="text-sm text-muted-foreground">Her yatakhane için kat, oda ve yatak durumunu takip edin.</p>
          </div>
          {canManage ? (
            <Link href="/yatakhane/yeni" className={cn(buttonVariants({ size: "sm" }))}>
              Yeni Yatakhane
            </Link>
          ) : null}
        </div>

        {dormitories.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {dormitories.map((dormitory) => {
              const occupied = dormitory.beds.filter((bed) => bed.is_active && bed.assignment?.status === "active").length;
              const total = Math.max(dormitory.beds.length, 1);
              const percent = Math.round((occupied / total) * 10000) / 100;

              return (
                <Card key={dormitory.id} className="bg-white">
                  <CardHeader className="border-b border-border">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle>{dormitory.name}</CardTitle>
                        {dormitory.description ? <CardDescription>{dormitory.description}</CardDescription> : null}
                      </div>
                      <span className="rounded-md border border-[#093657]/15 bg-[#f8fafc] px-2 py-1 text-xs font-medium text-[#093657]">
                        {dormitory.is_active ? "Aktif" : "Pasif"}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 p-4">
                    <DormitorySummaryGrid
                      items={[
                        { label: "Kat", value: dormitory.floors.length },
                        { label: "Oda", value: dormitory.rooms.length },
                        { label: "Yatak", value: dormitory.beds.length },
                        { label: "Doluluk", value: `%${percent}` },
                      ]}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/yatakhane/${dormitory.id}`} className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}>
                        Detay
                      </Link>
                      {canManage ? (
                        <Link href={`/yatakhane/${dormitory.id}/duzenle`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                          Düzenle
                        </Link>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">Henüz yatakhane kaydı bulunmuyor.</CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
