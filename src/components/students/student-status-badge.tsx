import { cn } from "@/lib/utils";
import type { StudentStatus } from "@/types/rbac";

const studentStatusMeta: Record<StudentStatus, { label: string; className: string }> = {
  active: {
    label: "Aktif",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  passive: {
    label: "Pasif",
    className: "border-slate-200 bg-slate-50 text-slate-700",
  },
  graduated: {
    label: "Mezun",
    className: "border-sky-200 bg-sky-50 text-sky-700",
  },
  left: {
    label: "Ayrıldı",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
};

export function StudentStatusBadge({ status }: { status: StudentStatus }) {
  const meta = studentStatusMeta[status];

  return <span className={cn("inline-flex rounded-md border px-2 py-1 text-xs font-medium", meta.className)}>{meta.label}</span>;
}
