import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, CheckCircle2, AlertTriangle, Calendar, Users } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { StudentTaskList } from "@/components/student-tasks/student-task-list";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { requireAuth } from "@/lib/auth";
import { canCreateStudentTask } from "@/lib/student-tasks/permissions";
import { getStudentTasks, getStudentTaskStats, getStudentsForTaskAssignment } from "@/lib/student-tasks/queries";

export default async function StudentTasksPage() {
  const { profile } = await requireAuth();

  if (!canCreateStudentTask(profile)) {
    redirect("/gorevler?error=unauthorized");
  }

  const { data: tasks } = await getStudentTasks(profile, { status: "pending" });
  const stats = await getStudentTaskStats(profile);
  const { data: allTasks } = await getStudentTasks(profile, {});

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Görev Yönetimi"
        title="Öğrenci Görevleri"
        description="Öğrencileri nöbet, temizlik ve diğer görevler için görevlendirin."
        actions={
          <Link href="/gorevler/ogrenci-gorevleri/yeni" className={cn(buttonVariants())}>
            <Plus className="mr-1.5 size-4" /> Yeni Öğrenci Görevi
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <DashboardStatCard icon={<Users className="size-4" />} label="Bekleyen" value={stats.pending} color="text-blue-700" bgColor="bg-blue-50" />
        <DashboardStatCard icon={<CheckCircle2 className="size-4" />} label="Tamamlanan" value={stats.completed} color="text-green-700" bgColor="bg-green-50" />
        <DashboardStatCard icon={<AlertTriangle className="size-4" />} label="Geciken" value={stats.overdue} color="text-red-700" bgColor="bg-red-50" />
        <DashboardStatCard icon={<Calendar className="size-4" />} label="Bugün" value={stats.dueToday} color="text-orange-700" bgColor="bg-orange-50" />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Bekleyen Görevler</h2>
        <StudentTaskList tasks={tasks} />
      </div>

      {allTasks.filter((t) => t.status === "completed").length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">Tamamlanan Görevler</h2>
          <StudentTaskList
            tasks={allTasks.filter((t) => t.status === "completed")}
            emptyText="Tamamlanan görev yok."
          />
        </div>
      )}
    </div>
  );
}

function DashboardStatCard({ icon, label, value, color, bgColor }: { icon: React.ReactNode; label: string; value: number; color: string; bgColor: string }) {
  return (
    <Card className={bgColor}>
      <CardContent className="flex items-center gap-3 pt-4">
        <div className={color}>{icon}</div>
        <div>
          <p className={cn("text-2xl font-bold", color)}>{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}