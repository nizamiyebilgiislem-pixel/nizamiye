import { Card, CardContent } from "@/components/ui/card";

export function DormitorySummaryGrid({ items }: { items: Array<{ label: string; value: string | number; description?: string }> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} size="sm" className="bg-white">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold text-[#093657]">{item.value}</p>
            {item.description ? <p className="mt-1 text-xs text-muted-foreground">{item.description}</p> : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
