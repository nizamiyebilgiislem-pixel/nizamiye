"use client";

import { useActionState } from "react";

import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { addCommentAction } from "@/lib/tasks/actions";

type TaskCommentFormProps = {
  taskId: string;
};

export function TaskCommentForm({ taskId }: TaskCommentFormProps) {
  const [state, formAction] = useActionState(addCommentAction, undefined);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="task_id" value={taskId} />
      <label className="grid gap-2 text-sm font-medium">
        Yorum Ekle
        <textarea
          name="comment"
          rows={3}
          required
          placeholder="Yorumunuz..."
          className="rounded-md border border-input bg-background px-3 py-2 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20"
        />
      </label>

      {state?.error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</div>
      )}

      <FormSubmitButton pendingLabel="Gönderiliyor...">Gönder</FormSubmitButton>
    </form>
  );
}
