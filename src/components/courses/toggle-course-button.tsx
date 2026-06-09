"use client";

import { useFormStatus } from "react-dom";
import { toggleCourseActiveAction } from "@/lib/courses/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ToggleCourseButtonProps = {
  courseId: string;
  departmentId: string;
  isActive: boolean;
};

function ToggleButtonContent({ isActive }: { isActive: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="ghost"
      size="sm"
      disabled={pending}
      className={cn(
        "text-xs",
        pending && "opacity-50",
        isActive ? "text-amber-600 hover:text-amber-700" : "text-emerald-600 hover:text-emerald-700",
      )}
    >
      {pending ? (isActive ? "Pasifleştiriliyor..." : "Aktifleştiriliyor...") : isActive ? "Pasifleştir" : "Aktifleştir"}
    </Button>
  );
}

export function ToggleCourseButton({ courseId, departmentId, isActive }: ToggleCourseButtonProps) {
  return (
    <form action={toggleCourseActiveAction}>
      <input type="hidden" name="course_id" value={courseId} />
      <input type="hidden" name="department_id" value={departmentId} />
      <ToggleButtonContent isActive={isActive} />
    </form>
  );
}
