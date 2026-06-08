import { Badge } from "@/components/ui/badge";
import { studentStatusLabels } from "@/lib/students/constants";
import type { StudentStatus } from "@/types/rbac";

type StatusBadgeProps = {
  status: StudentStatus;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const variant = status === "active" ? "default" : "outline";

  return <Badge variant={variant}>{studentStatusLabels[status]}</Badge>;
}
