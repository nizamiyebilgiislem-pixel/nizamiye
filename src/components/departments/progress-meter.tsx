import { cn } from "@/lib/utils";

export function ProgressMeter({
  label,
  value,
  max = 100,
  muted,
}: {
  label: string;
  value: number | null;
  max?: number;
  muted?: string;
}) {
  if (value === null) {
    return (
      <div className="rounded-md border border-border bg-[#f8fafc] p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-2 text-sm font-medium text-muted-foreground">{muted ?? "Veri yok"}</p>
      </div>
    );
  }

  const percent = Math.max(0, Math.min(100, Math.round((value / max) * 100)));

  return (
    <div className="rounded-md border border-border bg-[#f8fafc] p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <span className="text-sm font-semibold text-[#093657]">{value.toLocaleString("tr-TR")}{max === 100 ? "%" : ""}</span>
      </div>
      <div className="mt-3 h-2 rounded-full bg-[#eaf1f6]">
        <div
          className={cn("h-2 rounded-full bg-[#093657]", percent >= 90 ? "bg-emerald-700" : percent >= 70 ? "bg-[#256c91]" : "")}
          style={{ width: `${Math.max(3, percent)}%` }}
        />
      </div>
    </div>
  );
}
