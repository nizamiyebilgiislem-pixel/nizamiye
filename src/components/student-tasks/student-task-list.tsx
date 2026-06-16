"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StudentAvatar } from "@/components/students/student-avatar";
import { cn } from "@/lib/utils";
import type { StudentTaskWithStudent } from "@/lib/student-tasks/queries";
import { taskTypeLabels } from "@/lib/student-tasks/actions";

const statusLabels = {
  pending: "Bekliyor",
  completed: "Tamamlandı",
};

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
};

export function StudentTaskList({
  tasks,
  showStudent = true,
  emptyText = "Öğrenci görevi bulunamadı.",
}: {
  tasks: StudentTaskWithStudent[];
  showStudent?: boolean;
  emptyText?: string;
}) {
  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          {emptyText}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => {
        const isOverdue = task.due_date && task.status === "pending" && new Date(task.due_date) < new Date();

        return (
          <Card key={task.id} className={cn(isOverdue && "border-red-200")}>
            <CardContent className="flex items-center gap-4 p-4">
              {showStudent && (
                <StudentAvatar
                  name={task.student.full_name}
                  photoUrl={task.student.photo_url}
                  size="sm"
                />
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">{task.title}</p>
                  <Badge variant="outline" className={cn("text-xs", statusColors[task.status as keyof typeof statusColors])}>
                    {statusLabels[task.status as keyof typeof statusLabels]}
                  </Badge>
                  {isOverdue && (
                    <Badge variant="destructive" className="text-xs">
                      Gecikmiş
                    </Badge>
                  )}
                </div>

                {showStudent && (
                  <p className="text-sm text-muted-foreground">
                    {task.student.full_name} - {task.student.course_class?.name}
                  </p>
                )}

                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span>{taskTypeLabels[task.task_type] ?? task.task_type}</span>
                  {task.due_date && (
                    <span className={cn(isOverdue && "text-red-600 font-medium")}>
                      {new Date(task.due_date).toLocaleDateString("tr-TR")}
                    </span>
                  )}
                  {task.assigned_by_profile && (
                    <span>Atayan: {task.assigned_by_profile.full_name}</span>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                {task.status === "pending" && (
                  <form action={async () => {
                    "use server";
                    const { completeStudentTaskAction } = await import("@/lib/student-tasks/actions");
                    await completeStudentTaskAction(task.id);
                  }}>
                    <button type="submit" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
                      Tamamla
                    </button>
                  </form>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}