import Link from "next/link";

import { AttendanceStatusBadge, AttendanceTypeBadge } from "@/components/attendance/attendance-badges";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AttendanceSessionWithRelations } from "@/lib/attendance/queries";
import { cn } from "@/lib/utils";

export function AttendanceSessionList({ sessions, canManageAll }: { sessions: AttendanceSessionWithRelations[]; canManageAll?: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Yoklama Listesi</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-[#f8fafc]">
            <tr className="[&>th]:px-4 [&>th]:py-3 [&>th]:text-left [&>th]:font-medium [&>th]:text-muted-foreground">
              <th>Tarih</th>
              <th>Tür</th>
              <th>Sınıf</th>
              <th>Bölüm</th>
              <th>Yoklamayı Alan</th>
              <th>Durum</th>
              <th>Özet</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-white">
            {sessions.length > 0 ? (
              sessions.map((session) => (
                <tr key={session.id} className="align-top [&>td]:px-4 [&>td]:py-3">
                  <td>{formatDate(session.attendance_date)}</td>
                  <td>
                    <AttendanceTypeBadge type={session.attendance_type} />
                  </td>
                  <td className="font-medium text-[#093657]">{session.course_class?.name ?? "-"}</td>
                  <td>{session.department?.name ?? "-"}</td>
                  <td>{session.taken_by_profile?.full_name ?? "-"}</td>
                  <td>
                    <AttendanceStatusBadge status={session.completion_status} />
                  </td>
                  <td className="text-muted-foreground">
                    {session.record_count}/{session.active_student_count} kayıt
                    <div className="mt-1 text-xs">
                      Var {session.present_count} · Yok {session.absent_count} · İzinli {session.excused_count} · Geç {session.late_count}
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/yoklama/${session.id}`} className={cn("text-sm font-medium text-[#093657] hover:underline")}>
                        Detay
                      </Link>
                      {canManageAll ? (
                        <Link href={`/yoklama/${session.id}/duzenle`} className={cn("text-sm font-medium text-[#093657] hover:underline")}>
                          Düzenle
                        </Link>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-10 text-center text-sm text-muted-foreground" colSpan={8}>
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(new Date(value));
}