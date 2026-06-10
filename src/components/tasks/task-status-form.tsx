"use client";

import { useActionState } from "react";

import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { updateTaskStatusAction } from "@/lib/tasks/actions";
import type { TaskStatus } from "@/types/tasks";
import { statusLabels } from "@/types/tasks";

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: "pending", label: "Bekliyor" },
  { value: "in_progress", label: "Devam Ediyor" },
  { value: "completed", label: "Tamamlandı" },
  { value: "cancelled", label: "İptal Et" },
];

type TaskStatusFormProps = {
  taskId: string;
  currentStatus: TaskStatus;
};

export function TaskStatusForm({ taskId, currentStatus }: TaskStatusFormProps) {
  const [state, formAction] = useActionState(updateTaskStatusAction, undefined);

  const availableStatuses = statusOptions.filter((o) => o.value !== currentStatus);

  return (
    <div className="rounded-lg border border-border bg-white p-4">
      <p className="mb-3 text-sm font-medium">Durum Güncelle</p>
      <div className="flex flex-wrap items-center gap-2">
        {availableStatuses.map((opt) => (
          <form key={opt.value} action={formAction}>
            <input type="hidden" name="id" value={taskId} />
            <input type="hidden" name="status" value={opt.value} />
            <FormSubmitButton variant="outline" size="sm">
              {statusLabels[opt.value]}
            </FormSubmitButton>
          </form>
        ))}
      </div>
      {state?.error && (
        <div className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</div>
      )}
    </div>
  );
}
