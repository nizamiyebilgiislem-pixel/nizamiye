import { Badge } from "@/components/ui/badge";
import { attendanceRecordStatusLabelsByType, attendanceStatusLabels, attendanceTypeLabels } from "@/lib/attendance/constants";
import type { AttendanceRecordStatus, AttendanceType } from "@/types/database";

export function AttendanceTypeBadge({ type }: { type: AttendanceType }) {
  return <Badge variant="outline">{attendanceTypeLabels[type]}</Badge>;
}

export function AttendanceStatusBadge({
  status,
  type = "daily",
}: {
  status: AttendanceRecordStatus | "completed" | "draft";
  type?: AttendanceType;
}) {
  if (status === "completed") {
    return <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">Tamamlandı</Badge>;
  }

  if (status === "draft") {
    return <Badge variant="outline">Taslak</Badge>;
  }

  return <Badge variant="outline">{attendanceRecordStatusLabelsByType[type][status]}</Badge>;
}

export function AttendanceStatusLabel({
  status,
  type = "daily",
}: {
  status: AttendanceRecordStatus;
  type?: AttendanceType;
}) {
  return <span>{attendanceStatusLabels[status] ?? attendanceRecordStatusLabelsByType[type][status]}</span>;
}
