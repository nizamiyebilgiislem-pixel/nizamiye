import { BookOpen, CheckCircle2, Clock, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { StudentCourseBookProgress } from "@/lib/course-books/queries";

const statusIcons = {
  not_started: <Clock className="size-4 text-gray-400" />,
  ongoing: <BookOpen className="size-4 text-blue-500" />,
  completed: <CheckCircle2 className="size-4 text-green-500" />,
};

const statusLabels = {
  not_started: "Başlanmadı",
  ongoing: "Devam Ediyor",
  completed: "Tamamlandı",
};

const statusColors = {
  not_started: "bg-gray-100 text-gray-600",
  ongoing: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
};

export function StudentCourseBooksPanel({
  progress,
  compact = false,
}: {
  progress: StudentCourseBookProgress[];
  compact?: boolean;
}) {
  if (progress.length === 0) {
    return null;
  }

  const groupedByCourse = progress.reduce((acc, p) => {
    const courseId = p.course_book?.course_id;
    if (!courseId) return acc;
    if (!acc[courseId]) {
      acc[courseId] = {
        courseName: p.course_book?.course?.name ?? "Bilinmeyen Ders",
        books: [],
      };
    }
    acc[courseId].books.push(p);
    return acc;
  }, {} as Record<string, { courseName: string; books: StudentCourseBookProgress[] }>);

  if (compact) {
    return (
      <div className="space-y-2">
        {Object.entries(groupedByCourse).slice(0, 3).map(([courseId, { courseName, books }]) => {
          const currentBook = books.find((b) => b.status !== "completed") ?? books[books.length - 1];
          const totalBooks = books.length;
          const completedBooks = books.filter((b) => b.status === "completed").length;

          return (
            <div key={courseId} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{courseName}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {currentBook.course_book?.title ?? "Kitap"}
                </span>
                <Badge variant="outline" className={cn("text-xs", statusColors[currentBook.status])}>
                  {completedBooks}/{totalBooks}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(groupedByCourse).map(([courseId, { courseName, books }]) => {
        const completedCount = books.filter((b) => b.status === "completed").length;
        const totalBooks = books.length;
        const currentBook = books.find((b) => b.status === "ongoing") ?? books.find((b) => b.status === "not_started") ?? books[books.length - 1];

        return (
          <div key={courseId} className="rounded-md border border-border p-3">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="font-medium">{courseName}</h4>
              <Badge variant="outline" className="text-xs">
                {completedCount}/{totalBooks} kitap
              </Badge>
            </div>
            {currentBook && (
              <div className="flex items-center gap-2 text-sm">
                {statusIcons[currentBook.status]}
                <span className="text-muted-foreground">{currentBook.course_book?.title ?? "Kitap"}</span>
                {currentBook.started_at && currentBook.status === "ongoing" && (
                  <span className="text-xs text-muted-foreground">
                    ({new Date(currentBook.started_at).toLocaleDateString("tr-TR")})
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}