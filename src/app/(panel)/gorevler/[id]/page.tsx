import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil, User, CalendarDays, MessageSquare, Paperclip, Clock } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { TaskStatusForm } from "@/components/tasks/task-status-form";
import { TaskCommentForm } from "@/components/tasks/task-comment-form";
import { TaskDeleteButton } from "@/components/tasks/task-delete-button";
import { requireAuth } from "@/lib/auth";
import { canUpdateTaskStatus, canCommentOnTask, canEditTask, canDeleteTask } from "@/lib/tasks/permissions";
import { getTaskById } from "@/lib/tasks/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { statusLabels, statusColors, priorityLabels, priorityColors } from "@/types/tasks";
import type { TaskStatus } from "@/types/tasks";

export default async function GorevDetayPage({ params }: { params: Promise<{ id: string }> }) {
  const { profile } = await requireAuth();
  const { id } = await params;

  const task = await getTaskById(id);
  if (!task) notFound();

  const canUpdate = canUpdateTaskStatus(profile, task);
  const canComment = canCommentOnTask(profile, task);
  const canEdit = canEditTask(profile, task);
  const canDelete = canDeleteTask(profile, task);
  const isAssignee = task.assigned_to === profile.id;

  const sc = statusColors[task.status as keyof typeof statusColors] ?? "";
  const pc = priorityColors[task.priority as keyof typeof priorityColors] ?? "";

  const today = new Date().toISOString().slice(0, 10);
  const isOverdue = task.due_date && task.due_date < today && task.status !== "completed" && task.status !== "cancelled";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Görev Yönetimi"
        title={task.title}
        actions={
          <div className="flex items-center gap-2">
            {canEdit ? (
              <Link href={`/gorevler/${id}/duzenle`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                <Pencil className="mr-1.5 size-4" /> Düzenle
              </Link>
            ) : null}
            {canDelete ? (
              <TaskDeleteButton taskId={id} />
            ) : null}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardContent className="space-y-5 pt-6">
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium", sc)}>
                  {statusLabels[task.status as keyof typeof statusLabels] ?? task.status}
                </span>
                <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium", pc)}>
                  {priorityLabels[task.priority as keyof typeof priorityLabels] ?? task.priority}
                </span>
                {task.department && <Badge variant="secondary">{task.department.name}</Badge>}
                {isOverdue && (
                  <span className="inline-flex items-center gap-1 rounded-md border border-red-300 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                    <Clock className="size-3" /> Gecikmiş
                  </span>
                )}
              </div>

              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <InfoRow
                  icon={<User className="size-3.5" />}
                  label="Atayan"
                  value={task.assigner?.full_name ?? "—"}
                />
                <InfoRow
                  icon={<User className="size-3.5" />}
                  label="Atanan"
                  value={task.assignee?.full_name ?? "—"}
                />
                {task.due_date && (
                  <InfoRow
                    icon={<CalendarDays className="size-3.5" />}
                    label="Son Tarih"
                    value={new Date(task.due_date).toLocaleDateString("tr-TR")}
                  />
                )}
                <InfoRow
                  icon={<CalendarDays className="size-3.5" />}
                  label="Oluşturulma"
                  value={new Date(task.created_at).toLocaleDateString("tr-TR", { dateStyle: "long", timeStyle: "short" })}
                />
                {task.completed_at && (
                  <InfoRow
                    icon={<CheckCircleIcon />}
                    label="Tamamlanma"
                    value={new Date(task.completed_at).toLocaleDateString("tr-TR", { dateStyle: "long", timeStyle: "short" })}
                  />
                )}
              </div>

              {task.description && (
                <div className="border-t border-border pt-4">
                  <p className="mb-1 text-xs font-medium text-muted-foreground">Açıklama</p>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">{task.description}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {canUpdate && !["completed", "cancelled"].includes(task.status) && (
            <TaskStatusForm taskId={id} currentStatus={task.status as TaskStatus} />
          )}

          {task.attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <Paperclip className="size-4" /> Ekler ({task.attachments.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {task.attachments.map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{a.file_name}</p>
                      <p className="text-[11px] text-muted-foreground">{a.uploader.full_name} · {new Date(a.created_at).toLocaleDateString("tr-TR")}</p>
                    </div>
                    <a
                      href={a.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(buttonVariants({ variant: "outline", size: "xs" }))}
                    >
                      Görüntüle
                    </a>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <MessageSquare className="size-4" /> Yorumlar ({task.comments.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {task.comments.length === 0 ? (
                <p className="text-sm text-muted-foreground">Henüz yorum yapılmamış.</p>
              ) : (
                task.comments.map((c) => (
                  <div key={c.id} className="rounded-md border border-border bg-muted/20 px-3 py-2.5">
                    <div className="mb-1 flex items-center gap-2">
                      <div className="flex size-6 items-center justify-center rounded-full bg-[#093657]/10 text-[10px] font-semibold text-[#093657]">
                        {c.profile.full_name.charAt(0)}
                      </div>
                      <p className="text-xs font-medium">{c.profile.full_name}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(c.created_at).toLocaleDateString("tr-TR", { dateStyle: "short", timeStyle: "short" })}</p>
                    </div>
                    <p className="whitespace-pre-wrap text-sm">{c.comment}</p>
                  </div>
                ))
              )}

              {canComment && (
                <div className="border-t border-border pt-4">
                  <TaskCommentForm taskId={id} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Hızlı İşlemler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {isAssignee && task.status === "pending" && (
                <form action="/" className="contents">
                  <input type="hidden" name="id" value={id} />
                  <input type="hidden" name="status" value="in_progress" />
                </form>
              )}
              {canUpdate && task.status !== "completed" && task.status !== "cancelled" && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Durum Değiştir</p>
                  <div className="flex flex-col gap-1.5">
                    {task.status !== "in_progress" && (
                      <QuickStatusButton taskId={id} status="in_progress" label="Devam Ediyor" />
                    )}
                    {task.status !== "completed" && (
                      <QuickStatusButton taskId={id} status="completed" label="Tamamlandı" />
                    )}
                    {task.status !== "cancelled" && (
                      <QuickStatusButton taskId={id} status="cancelled" label="İptal Et" />
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Görev Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID</span>
                <span className="font-mono text-xs">#{task.id.slice(0, 8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Öncelik</span>
                <span>{priorityLabels[task.priority as keyof typeof priorityLabels] ?? task.priority}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Durum</span>
                <span>{statusLabels[task.status as keyof typeof statusLabels] ?? task.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Yorumlar</span>
                <span>{task.comments.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ekler</span>
                <span>{task.attachments.length}</span>
              </div>
            </CardContent>
          </Card>

          <Link href="/gorevler" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full")}>
            <ArrowLeft className="mr-1.5 size-4" /> Tüm Görevler
          </Link>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground">{icon}</span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function CheckCircleIcon() {
  return (
    <svg className="size-3.5 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function QuickStatusButton({ taskId, status, label }: { taskId: string; status: string; label: string }) {
  return (
    <form action={async () => {
      "use server";
      const { updateTaskStatusAction } = await import("@/lib/tasks/actions");
      const formData = new FormData();
      formData.set("id", taskId);
      formData.set("status", status);
      await updateTaskStatusAction(null, formData);
    }}>
      <button
        type="submit"
        className={cn(
          buttonVariants({ variant: "outline", size: "xs" }),
          "w-full justify-start text-xs",
        )}
      >
        {status === "completed" ? "✓ " : status === "cancelled" ? "✕ " : "▶ "}
        {label}
      </button>
    </form>
  );
}
