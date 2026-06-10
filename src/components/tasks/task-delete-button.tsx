"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { deleteTaskAction } from "@/lib/tasks/actions";

type TaskDeleteButtonProps = {
  taskId: string;
};

export function TaskDeleteButton({ taskId }: TaskDeleteButtonProps) {
  const [state, formAction] = useActionState(deleteTaskAction, undefined);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!confirm("Bu görevi silmek istediğinize emin misiniz?")) {
      e.preventDefault();
    }
  }

  return (
    <form action={formAction} onSubmit={handleSubmit}>
      <input type="hidden" name="id" value={taskId} />
      <Button
        type="submit"
        variant="outline"
        size="sm"
        className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
      >
        <Trash2 className="mr-1.5 size-4" /> Sil
      </Button>
      {state?.error && (
        <p className="mt-1 text-xs text-red-600">{state.error}</p>
      )}
    </form>
  );
}
