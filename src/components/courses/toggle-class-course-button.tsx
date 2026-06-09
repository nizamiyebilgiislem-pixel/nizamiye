"use client";

import { useFormStatus } from "react-dom";
import { toggleClassCourseActiveAction } from "@/lib/courses/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ToggleClassCourseButtonProps = {
  classCourseId: string;
  classId: string;
  isActive: boolean;
};

function ToggleContent({ isActive }: { isActive: boolean }) {
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

export function ToggleClassCourseButton({ classCourseId, classId, isActive }: ToggleClassCourseButtonProps) {
  return (
    <form action={toggleClassCourseActiveAction}>
      <input type="hidden" name="id" value={classCourseId} />
      <input type="hidden" name="class_id" value={classId} />
      <ToggleContent isActive={isActive} />
    </form>
  );
}
