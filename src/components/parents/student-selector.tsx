"use client";

import Link from "next/link";
import { useState } from "react";

import { StudentAvatar } from "@/components/students/student-avatar";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type SelectableStudent = {
  id: string;
  full_name: string;
  photo_url: string | null;
  course_class?: { name: string } | null;
  department?: { name: string } | null;
  gradeAverage?: number | null;
  hafizlikPercentage?: number | null;
  attendanceRate?: number | null;
};

export function StudentSelector({
  students,
  selectedId,
  baseHref,
}: {
  students: SelectableStudent[];
  selectedId: string | null;
  baseHref: string;
}) {
  const [showAll, setShowAll] = useState(false);

  const visibleStudents = showAll ? students : students.slice(0, 3);
  const hiddenCount = students.length - 3;

  return (
    <div className="flex flex-wrap gap-2">
      {visibleStudents.map((student) => {
        const isSelected = selectedId === student.id;
        return (
          <Link
            key={student.id}
            href={`${baseHref}/${student.id}`}
            className={cn(
              "flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors",
              isSelected
                ? "border-primary bg-primary/10"
                : "border-border bg-background hover:bg-muted"
            )}
          >
            <StudentAvatar name={student.full_name} photoUrl={student.photo_url} size="sm" />
            <div>
              <p className={cn("text-sm font-medium", isSelected && "text-primary")}>
                {student.full_name}
              </p>
              {student.course_class && (
                <p className="text-xs text-muted-foreground">{student.course_class.name}</p>
              )}
            </div>
          </Link>
        );
      })}
      {!showAll && hiddenCount > 0 && (
        <button
          onClick={() => setShowAll(true)}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          +{hiddenCount} öğrenci
        </button>
      )}
      {showAll && students.length > 3 && (
        <button
          onClick={() => setShowAll(false)}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          Daha az göster
        </button>
      )}
    </div>
  );
}