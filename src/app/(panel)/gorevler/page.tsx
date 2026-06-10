import Link from "next/link";
import { Plus, CheckCircle2, Clock, AlertTriangle, Calendar } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth";
import { canCreateTask } from "@/lib/tasks/permissions";
import { getTasks, getTaskCounts } from "@/lib/tasks/queries";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { statusLabels, statusColors, priorityLabels, priorityColors } from "@/types/tasks";

export default async function GorevlerPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; status?: string }>;
}) {
  const { profile } = await requireAuth();
  const params = await searchParams;
  const activeTab = params.tab ?? "hepsi";

  const tasks = await getTasks(profile);
  const counts = await getTaskCounts(profile);
  const canCreate = canCreateTask(profile);

  let filteredTasks = tasks;

  if (activeTab === "my") {
    filteredTasks = tasks.filter((t) => t.assigned_to === profile.id);
  } else if (activeTab === "overdue") {
    const today = new Date().toISOString().slice(0, 10);
    filteredTasks = tasks.filter((t) => t.due_date && t.due_date < today && t.status !== "completed" && t.status !== "cancelled");
  } else if (activeTab !== "hepsi") {
    filteredTasks = tasks.filter((t) => t.status === activeTab);
  }

  const tabs = [
    { key: "hepsi", label: "Hepsi", count: counts.total },
    { key: "my", label: "Bana Atanan", count: counts.myTasks },
    { key: "pending", label: "Bekleyen", count: counts.pending },
    { key: "in_progress", label: "Devam Eden", count: counts.in_progress },
    { key: "overdue", label: "Geciken", count: counts.overdue },
    { key: "completed", label: "Tamamlanan", count: counts.completed },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Modül"
        title="Görev Yönetimi"
        description="Kurum içi iş ve sorumluluk takibi. Bu alan rol atama sistemi değildir."
        actions={
          canCreate ? (
            <div className="flex gap-2">
              <Link href="/gorevler/yeni" className={cn(buttonVariants({ size: "sm" }))}>
                <Plus className="mr-1.5 size-4" /> Yeni Görev
              </Link>
            </div>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <DashboardStatCard icon={<Clock className="size-4" />} label="Açık Görev" value={counts.pending + counts.in_progress} color="text-blue-700" bgColor="bg-blue-50" />
        <DashboardStatCard icon={<CheckCircle2 className="size-4" />} label="Tamamlanan" value={counts.completed} color="text-green-700" bgColor="bg-green-50" />
        <DashboardStatCard icon={<AlertTriangle className="size-4" />} label="Geciken" value={counts.overdue} color="text-red-700" bgColor="bg-red-50" />
        <DashboardStatCard icon={<Calendar className="size-4" />} label="Bugün Bitecek" value={counts.dueToday} color="text-orange-700" bgColor="bg-orange-50" />
        <DashboardStatCard icon={<CheckCircle2 className="size-4" />} label="Toplam" value={counts.total} color="text-[#093657]" bgColor="bg-[#093657]/5" />
      </div>

      <div className="flex flex-wrap items-center gap-1 border-b border-border">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.key === "hepsi" ? "/gorevler" : `/gorevler?tab=${tab.key}`}
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

      {filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">Henüz görev bulunmuyor.</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((t) => {
            const sc = statusColors[t.status as keyof typeof statusColors] ?? "";
            const pc = priorityColors[t.priority as keyof typeof priorityColors] ?? "";
            const today = new Date().toISOString().slice(0, 10);
            const isOverdue = t.due_date && t.due_date < today && t.status !== "completed" && t.status !== "cancelled";

            return (
              <Link
                key={t.id}
                href={`/gorevler/${t.id}`}
                className="block rounded-lg border border-border bg-white p-4 transition-colors hover:border-[#093657]/30 hover:bg-muted/20"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      {t.priority === "urgent" && (
                        <span className="size-2 shrink-0 rounded-full bg-red-500" title="Acil" />
                      )}
                      <h3 className="truncate text-sm font-medium">{t.title}</h3>
                      <span className={cn("inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium", sc)}>
                        {statusLabels[t.status as keyof typeof statusLabels] ?? t.status}
                      </span>
                      <span className={cn("inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium", pc)}>
                        {priorityLabels[t.priority as keyof typeof priorityLabels] ?? t.priority}
                      </span>
                    </div>
                    {t.description && (
                      <p className="line-clamp-1 text-sm text-muted-foreground">{t.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                      <span>{new Date(t.created_at).toLocaleDateString("tr-TR")}</span>
                      {t.assigner && <span>Atayan: {t.assigner.full_name}</span>}
                      {t.assignee && <span>Atanan: {t.assignee.full_name}</span>}
                      {t.due_date && (
                        <span className={cn("inline-flex items-center gap-1", isOverdue && "font-semibold text-red-600")}>
                          {isOverdue && <AlertTriangle className="size-3" />}
                          Son: {new Date(t.due_date).toLocaleDateString("tr-TR")}
                        </span>
                      )}
                      {t.department && <span className="rounded bg-muted/50 px-1 py-0.5">{t.department.name}</span>}
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
