"use client";

import Link from "next/link";

import { StudentAvatar } from "@/components/students/student-avatar";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StudentComparisonTable({
  students,
}: {
  students: Array<{
    id: string;
    full_name: string;
    photo_url: string | null;
    course_class?: { name: string } | null;
    gradeAverage?: number | null;
    hafizlikPercentage?: number | null;
    attendanceRate?: number | null;
  }>;
}) {
  if (students.length < 2) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Öğrenci Karşılaştırma</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left font-medium text-muted-foreground pb-2">Öğrenci</th>
                <th className="text-center font-medium text-muted-foreground pb-2">Sınıf</th>
                <th className="text-center font-medium text-muted-foreground pb-2">Not Ort.</th>
                <th className="text-center font-medium text-muted-foreground pb-2">Hafızlık</th>
                <th className="text-center font-medium text-muted-foreground pb-2">Devam</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id} className="border-b last:border-0">
                  <td className="py-3">
                    <Link href={`/talebeler/${student.id}`} className="flex items-center gap-2 hover:underline">
                      <StudentAvatar name={student.full_name} photoUrl={student.photo_url} size="sm" />
                      <span className="font-medium">{student.full_name}</span>
                    </Link>
                  </td>
                  <td className="text-center text-muted-foreground">
                    {student.course_class?.name ?? "-"}
                  </td>
                  <td className="text-center">
                    <span className={cn(
                      "font-semibold",
                      student.gradeAverage !== null && student.gradeAverage !== undefined
                        ? student.gradeAverage >= 85 ? "text-green-600" : student.gradeAverage >= 70 ? "text-yellow-600" : "text-red-600"
                        : "text-muted-foreground"
                    )}>
                      {student.gradeAverage !== null && student.gradeAverage !== undefined
                        ? student.gradeAverage.toFixed(1)
                        : "-"}
                    </span>
                  </td>
                  <td className="text-center">
                    <span className={cn(
                      "font-semibold",
                      student.hafizlikPercentage !== null && student.hafizlikPercentage !== undefined
                        ? student.hafizlikPercentage >= 50 ? "text-green-600" : "text-blue-600"
                        : "text-muted-foreground"
                    )}>
                      {student.hafizlikPercentage !== null && student.hafizlikPercentage !== undefined
                        ? `%${student.hafizlikPercentage}`
                        : "-"}
                    </span>
                  </td>
                  <td className="text-center">
                    <span className={cn(
                      "font-semibold",
                      student.attendanceRate !== null && student.attendanceRate !== undefined
                        ? student.attendanceRate >= 90 ? "text-green-600" : student.attendanceRate >= 75 ? "text-yellow-600" : "text-red-600"
                        : "text-muted-foreground"
                    )}>
                      {student.attendanceRate !== null && student.attendanceRate !== undefined
                        ? `%${student.attendanceRate}`
                        : "-"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}