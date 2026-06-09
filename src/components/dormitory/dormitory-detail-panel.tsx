import Link from "next/link";
import { Plus, UserX } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DormitoryAssignmentWithRelations, DormitoryWithDepartment } from "@/lib/dormitory/queries";
import { endAssignmentAction } from "@/lib/dormitory/actions";

type DormitoryDetailPanelProps = {
  dormitory: DormitoryWithDepartment;
  assignments: DormitoryAssignmentWithRelations[];
  assignedCount: number;
  canManage: boolean;
};

export function DormitoryDetailPanel({ dormitory, assignments, assignedCount, canManage }: DormitoryDetailPanelProps) {
  const available = dormitory.capacity - assignedCount;
  const occupancyPercent = dormitory.capacity > 0 ? Math.round((assignedCount / dormitory.capacity) * 100) : 0;
  const isFull = assignedCount >= dormitory.capacity;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Kapasite" value={String(dormitory.capacity)} />
        <StatCard label="Yerleşen" value={String(assignedCount)} />
        <StatCard label="Boş Kontenjan" value={String(Math.max(0, available))} color={isFull ? "red" : "default"} />
        <StatCard label="Doluluk" value={`%${occupancyPercent}`} color={isFull ? "red" : "default"} />
      </div>

      <div className="h-2 rounded-full bg-[#eaf1f6]">
        <div
          className={cn("h-2 rounded-full transition-all", isFull ? "bg-red-500" : "bg-[#093657]")}
          style={{ width: `${Math.min(100, Math.max(4, occupancyPercent))}%` }}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-3">
          <CardTitle className="text-base">Aktif Öğrenciler</CardTitle>
          {canManage && !isFull && (
            <Link href={`/yatakhane/${dormitory.id}/yerlestir`} className={cn(buttonVariants({ size: "sm" }))}>
              <Plus className="size-3.5" aria-hidden="true" />
              Öğrenci Ekle
            </Link>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {assignments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Ad Soyad</th>
                    <th className="px-4 py-3 font-medium">Sınıf</th>
                    <th className="px-4 py-3 font-medium">Yerleşim Tarihi</th>
                    {canManage && <th className="px-4 py-3 font-medium">İşlem</th>}
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((assignment) => (
                    <tr key={assignment.id} className="border-b border-border last:border-0 hover:bg-[#f8fafc]">
                      <td className="px-4 py-3">
                        <Link href={`/talebeler/${assignment.student?.id}`} className="font-medium text-[#093657] hover:underline">
                          {assignment.student?.full_name ?? "Bilinmeyen"}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{assignment.student?.course_class?.name ?? "-"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(assignment.start_date)}</td>
                      {canManage && (
                        <td className="px-4 py-3">
                          <form action={endAssignmentAction.bind(null, assignment.id) as unknown as (formData: FormData) => Promise<void>}>
                            <Button type="submit" variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 hover:text-red-700">
                              <UserX className="size-3.5" aria-hidden="true" />
                              Yerleşimi Sonlandır
                            </Button>
                          </form>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              Bu yatakhanede henüz yerleşim bulunmamaktadır.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value, color = "default" }: { label: string; value: string; color?: "default" | "red" }) {
  return (
    <Card>
      <CardContent className="p-4 text-center">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn("mt-0.5 text-2xl font-semibold", color === "red" ? "text-red-600" : "text-[#093657]")}>{value}</p>
      </CardContent>
    </Card>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(new Date(value));
}
