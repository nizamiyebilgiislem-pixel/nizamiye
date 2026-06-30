import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { TaskEditForm } from "@/components/tasks/task-edit-form";
import { requireAuth } from "@/lib/auth";
import { canEditTask } from "@/lib/tasks/permissions";
import { getAssignableProfiles, getDepartmentOptions } from "@/lib/tasks/queries";

export default async function GorevDuzenlePage({ params }: { params: Promise<{ id: string }> }) {
  const { profile } = await requireAuth();
  const { id } = await params;

  const [task, assignableProfiles, departmentOptions] = await Promise.all([
    getTaskByIdRaw(id),
    getAssignableProfiles(profile),
    getDepartmentOptions(),
  ]);

  if (!task) notFound();

  if (!canEditTask(profile, task)) {
    return <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Bu işlem için yetkiniz bulunmamaktadır.</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Görev Yönetimi" title="Görevi Düzenle" description="Görev bilgilerini güncelleyin." />
      <TaskEditForm task={task} assignableProfiles={assignableProfiles} departmentOptions={departmentOptions} />
    </div>
  );
}

async function getTaskByIdRaw(id: string) {
  const { createSupabaseAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase.from("tasks").select("*").eq("id", id).single();
  return data;
}
