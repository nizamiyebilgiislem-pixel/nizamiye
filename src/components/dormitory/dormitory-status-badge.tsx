import { Badge } from "@/components/ui/badge";
import type { DormitoryAssignmentStatus } from "@/types/database";

export function DormitoryAssignmentStatusBadge({ status }: { status: DormitoryAssignmentStatus | "vacant" | "inactive" }) {
  if (status === "active") {
    return <Badge variant="default">Dolu</Badge>;
  }

  if (status === "ended") {
    return <Badge variant="outline">Sonlandırıldı</Badge>;
  }

  if (status === "inactive") {
    return <Badge variant="secondary">Pasif</Badge>;
  }

  return <Badge variant="outline" className="bg-emerald-50 text-emerald-800 hover:bg-emerald-50">Boş</Badge>;
}
