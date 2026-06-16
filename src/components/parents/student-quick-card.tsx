"use client";

import Link from "next/link";

import { StudentAvatar } from "@/components/students/student-avatar";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StudentQuickCard({
  student,
  gradeAverage,
  hafizlikPercentage,
  attendanceRate,
  pdfBaseHref,
}: {
  student: {
    id: string;
    full_name: string;
    photo_url: string | null;
    course_class?: { name: string } | null;
    department?: { name: string } | null;
  };
  gradeAverage?: number | null;
  hafizlikPercentage?: number | null;
  attendanceRate?: number | null;
  pdfBaseHref: string;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex gap-4 p-4">
          <StudentAvatar
            name={student.full_name}
            photoUrl={student.photo_url}
            size="lg"
            previewable
          />
          <div className="flex-1">
            <h3 className="font-semibold text-[#093657]">{student.full_name}</h3>
            <p className="text-sm text-muted-foreground">
              {student.department?.name ?? "-"} · {student.course_class?.name ?? "-"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 divide-x divide-border border-t">
          <div className="flex flex-col items-center p-3 text-center">
            <span className="text-lg font-bold text-[#093657]">
              {gradeAverage !== null && gradeAverage !== undefined ? gradeAverage.toFixed(1) : "-"}
            </span>
            <span className="text-xs text-muted-foreground">Not Ort.</span>
          </div>
          <div className="flex flex-col items-center p-3 text-center">
            <span className={cn(
              "text-lg font-bold",
              hafizlikPercentage !== null && hafizlikPercentage !== undefined
                ? hafizlikPercentage >= 50 ? "text-green-600" : "text-blue-600"
                : "text-muted-foreground"
            )}>
              {hafizlikPercentage !== null && hafizlikPercentage !== undefined ? `%${hafizlikPercentage}` : "-"}
            </span>
            <span className="text-xs text-muted-foreground">Hafızlık</span>
          </div>
          <div className="flex flex-col items-center p-3 text-center">
            <span className={cn(
              "text-lg font-bold",
              attendanceRate !== null && attendanceRate !== undefined
                ? attendanceRate >= 90 ? "text-green-600" : attendanceRate >= 75 ? "text-yellow-600" : "text-red-600"
                : "text-muted-foreground"
            )}>
              {attendanceRate !== null && attendanceRate !== undefined ? `%${attendanceRate}` : "-"}
            </span>
            <span className="text-xs text-muted-foreground">Devam</span>
          </div>
        </div>

        <div className="flex gap-2 border-t p-3">
          <Link href={`/talebeler/${student.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "flex-1")}>
            Detay
          </Link>
          <Link href={`/talebeler/${student.id}/notlar/pdf`} target="_blank" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
            Not PDF
          </Link>
          <Link href={`/talebeler/${student.id}/hafizlik/pdf`} target="_blank" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
            Hafızlık PDF
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}