import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DormitoryAssignmentWithRelations } from "@/lib/dormitory/queries";

type StudentDormitoryPanelProps = {
  activeAssignment: DormitoryAssignmentWithRelations | null;
  history: DormitoryAssignmentWithRelations[];
};

export function StudentDormitoryPanel({ activeAssignment, history }: StudentDormitoryPanelProps) {
  return (
    <div className="space-y-6">
      {activeAssignment ? (
        <Card>
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-base">Aktif Yerleşim</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
            <InfoItem label="Yatakhane" value={activeAssignment.dormitory?.name ?? "-"} />
            <InfoItem label="Bölüm" value={activeAssignment.dormitory?.department?.name ?? "-"} />
            <InfoItem label="Başlangıç Tarihi" value={formatDate(activeAssignment.start_date)} />
            <InfoItem label="Durum" value="Aktif" />
            {activeAssignment.note && <InfoItem label="Not" value={activeAssignment.note} />}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Bu talebenin aktif yatakhane kaydı bulunmamaktadır.
          </CardContent>
        </Card>
      )}

      {history.length > 0 && (
        <Card>
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-base">Geçmiş Yerleşimler</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Yatakhane</th>
                    <th className="px-4 py-3 font-medium">Bölüm</th>
                    <th className="px-4 py-3 font-medium">Başlangıç</th>
                    <th className="px-4 py-3 font-medium">Bitiş</th>
                    <th className="px-4 py-3 font-medium">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((assignment) => (
                    <tr key={assignment.id} className="border-b border-border last:border-0 hover:bg-[#f8fafc]">
                      <td className="px-4 py-3 font-medium text-[#0f172a]">{assignment.dormitory?.name ?? "-"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{assignment.dormitory?.department?.name ?? "-"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(assignment.start_date)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{assignment.end_date ? formatDate(assignment.end_date) : "-"}</td>
                      <td className="px-4 py-3">
                        <span className={assignment.status === "active" ? "text-green-600" : "text-muted-foreground"}>
                          {assignment.status === "active" ? "Aktif" : "Sonlandı"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-[#f8fafc] p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-[#0f172a]">{value}</p>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(new Date(value));
}
