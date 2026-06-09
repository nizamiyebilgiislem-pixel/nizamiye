"use client";

import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { Plus, X } from "lucide-react";

import { createDepartmentCourseAction } from "@/lib/courses/actions";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type DepartmentCourseInlineFormProps = {
  departmentId: string;
};

export function DepartmentCourseInlineForm({ departmentId }: DepartmentCourseInlineFormProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(createDepartmentCourseAction, null);

  useEffect(() => {
    if (state?.success) {
      router.refresh();
      const id = setTimeout(() => setOpen(false), 0);
      return () => clearTimeout(id);
    }
  }, [state?.success, router]);

  if (!open) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="mr-1 size-3.5" />
        Ders Ekle
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <form
        ref={formRef}
        action={formAction}
        className="flex items-center gap-2"
      >
        <input type="hidden" name="department_id" value={departmentId} />
        <input
          type="text"
          name="name"
          placeholder="Ders adı"
          required
          minLength={2}
          className={cn(
            "h-8 w-44 rounded-md border border-input bg-background px-2 text-xs",
            "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring",
          )}
          disabled={pending}
        />
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Kaydediliyor..." : "Kaydet"}
        </Button>
        <Button type="button" variant="ghost" size="icon" disabled={pending} onClick={() => setOpen(false)}>
          <X className="size-4" />
        </Button>
      </form>
      {state?.error ? (
        <p className="text-xs text-destructive">{state.error}</p>
      ) : null}
    </div>
  );
}
