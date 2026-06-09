"use client";

import { useEffect, useState, useActionState } from "react";
import { Plus, X } from "lucide-react";

import { assignCourseToClassAction } from "@/lib/courses/actions";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { CourseRow } from "@/types/database";

type ClassCourseAssignFormProps = {
  classId: string;
  availableCourses: CourseRow[];
};

export function ClassCourseAssignForm({ classId, availableCourses }: ClassCourseAssignFormProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [state, formAction, pending] = useActionState(assignCourseToClassAction, null);

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
        Ders Ata
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <form className="flex items-center gap-2" action={formAction}>
        <input type="hidden" name="class_id" value={classId} />
        <select
          name="course_id"
          required
          className={cn(
            "h-8 rounded-md border border-input bg-background px-2 text-xs",
            "focus:outline-none focus:ring-2 focus:ring-ring",
          )}
          disabled={pending}
        >
          <option value="">Ders seçin</option>
          {availableCourses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.name}
            </option>
          ))}
        </select>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Atanıyor..." : "Ata"}
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
