import { PageHeader } from "@/components/layout/page-header";
import { TaskForm } from "@/components/tasks/task-form";
import { requireAuth } from "@/lib/auth";
import { canCreateTask } from "@/lib/tasks/permissions";
import { getAssignableProfiles, getDepartmentOptions } from "@/lib/tasks/queries";

export default async function YeniGorevPage() {
  const { profile } = await requireAuth();

  if (!canCreateTask(profile)) {
    return <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Bu işlem için yetkiniz bulunmamaktadır.</div>;
  }

  const [assignableProfiles, departmentOptions] = await Promise.all([
    getAssignableProfiles(profile),
    getDepartmentOptions(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Görev Yönetimi" title="Yeni Görev" description="Kurum içi personele yapılacak iş veya sorumluluk atayın." />
      <TaskForm
        assignableProfiles={assignableProfiles}
        departmentOptions={departmentOptions}
        currentProfileRole={profile.role}
      />
    </div>
  );
}
