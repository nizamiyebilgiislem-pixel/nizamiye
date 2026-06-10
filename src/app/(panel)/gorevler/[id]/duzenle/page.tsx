import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { TaskEditForm } from "@/components/tasks/task-edit-form";
import { requireAuth } from "@/lib/auth";
import { canEditTask } from "@/lib/tasks/permissions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export default async function GorevDuzenlePage({ params }: { params: Promise<{ id: string }> }) {
  const { profile } = await requireAuth();
  const { id } = await params;

  const supabase = createSupabaseAdminClient();
  const { data: task } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", id)
    .single();

  if (!task) notFound();

  if (!canEditTask(profile, task)) {
    return <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Bu işlem için yetkiniz bulunmamaktadır.</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Görev Yönetimi" title="Görevi Düzenle" description="Görev bilgilerini güncelleyin." />
      <TaskEditForm task={task} />
    </div>
  );
}
