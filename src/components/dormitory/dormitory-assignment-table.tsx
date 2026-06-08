import Link from "next/link";

import { StudentAvatar } from "@/components/students/student-avatar";
import { DormitoryAssignmentStatusBadge } from "@/components/dormitory/dormitory-status-badge";
import { Card, CardContent } from "@/components/ui/card";
import type { DormitoryAssignmentWithRelations } from "@/lib/dormitory/queries";

export function DormitoryAssignmentTable({ items, showActions = true }: { items: DormitoryAssignmentWithRelations[]; showActions?: boolean }) {
  return (
    <Card>
      <CardContent className="overflow-x-auto p-0">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-[#f8fafc]">
            <tr className="[&>th]:px-4 [&>th]:py-3 [&>th]:text-left [&>th]:font-medium [&>th]:text-muted-foreground">
              <th>Talebe</th>
              <th>Bölüm</th>
              <th>Sınıf</th>
              <th>Yatakhane</th>
              <th>Kat</th>
              <th>Oda</th>
              <th>Yatak</th>
              <th>Başlangıç</th>
              <th>Durum</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-white">
            {items.length > 0 ? (
              items.map((assignment) => (
                <tr key={assignment.id} className="[&>td]:px-4 [&>td]:py-3 align-top">
                  <td>
                    <div className="flex items-center gap-3">
                      <StudentAvatar name={assignment.student?.full_name ?? "Talebe"} photoUrl={assignment.student?.photo_url ?? null} />
                      <div>
                        <p className="font-medium text-[#093657]">{assignment.student?.full_name ?? "-"}</p>
                        <p className="text-xs text-muted-foreground">{assignment.student?.guardian_phone ?? "-"}</p>
                      </div>
                    </div>
                  </td>
                  <td>{assignment.student?.department?.name ?? "-"}</td>
                  <td>{assignment.student?.course_class?.name ?? "-"}</td>
                  <td>{assignment.dormitory?.name ?? "-"}</td>
                  <td>{assignment.floor?.name ?? "-"}</td>
                  <td>{assignment.room?.name ?? "-"}</td>
                  <td>{assignment.bed?.bed_no ?? "-"}</td>
                  <td>{assignment.start_date}</td>
                  <td>
                    <DormitoryAssignmentStatusBadge status={assignment.status} />
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/talebeler/${assignment.student_id}`} className="text-sm font-medium text-[#093657] hover:underline">
                        Talebe
                      </Link>
                      {showActions ? (
                        <Link href={`/yatakhane/yerlesim/${assignment.id}`} className="text-sm font-medium text-[#093657] hover:underline">
                          Detay
                        </Link>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  Kayıt bulunamadı.
                </td>
              </tr>
            )}
              </tbody>
            </table>
          </CardContent>
        </Card>
  );
}
