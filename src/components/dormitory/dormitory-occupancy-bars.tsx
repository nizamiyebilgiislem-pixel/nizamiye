import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DormitoryOccupancyBars({
  title,
  items,
}: {
  title: string;
  items: Array<{ label: string; percent: number; detail?: string }>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-4">
        {items.length > 0 ? (
          items.map((item) => (
            <div key={item.label} className="space-y-1">
              <div className="flex items-center justify-between gap-3 text-sm">
                <p className="font-medium text-[#093657]">{item.label}</p>
                <p className="text-muted-foreground">{item.percent.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}%</p>
              </div>
              <div className="h-2 rounded-full bg-[#eaf1f6]">
                <div className="h-2 rounded-full bg-[#093657]" style={{ width: `${Math.max(4, Math.min(100, item.percent))}%` }} />
              </div>
              {item.detail ? <p className="text-xs text-muted-foreground">{item.detail}</p> : null}
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">Veri yok.</p>
        )}
      </CardContent>
    </Card>
  );
}
