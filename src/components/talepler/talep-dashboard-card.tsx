import Link from "next/link";
import { ClipboardList } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { statusLabels } from "@/lib/talepler/queries";

type TalepDashboardCardProps = {
  bekliyor: number;
  incelemede: number;
  isleme_alindi: number;
  acil: number;
  recentTalepler: Array<{ id: string; title: string; status: string; priority: string }>;
};

export function TalepDashboardCard({ bekliyor, incelemede, isleme_alindi, acil, recentTalepler }: TalepDashboardCardProps) {
  return (
    <Card className="bg-white">
      <CardHeader className="border-b border-border pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <ClipboardList className="size-4 text-[#093657]" />
          Talepler
        </CardTitle>
        <CardDescription className="text-xs">Talep durum özeti</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 p-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-md border border-yellow-200 bg-yellow-50 p-2 text-center">
            <p className="text-lg font-bold text-yellow-700">{bekliyor}</p>
            <p className="text-xs text-yellow-600">Bekleyen</p>
          </div>
          <div className="rounded-md border border-blue-200 bg-blue-50 p-2 text-center">
            <p className="text-lg font-bold text-blue-700">{incelemede}</p>
            <p className="text-xs text-blue-600">İncelemede</p>
          </div>
          <div className="rounded-md border border-indigo-200 bg-indigo-50 p-2 text-center">
            <p className="text-lg font-bold text-indigo-700">{isleme_alindi}</p>
            <p className="text-xs text-indigo-600">İşleme Alınan</p>
          </div>
          <div className="rounded-md border border-red-200 bg-red-50 p-2 text-center">
            <p className="text-lg font-bold text-red-700">{acil}</p>
            <p className="text-xs text-red-600">Acil</p>
          </div>
        </div>

        {recentTalepler.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Son Talepler</p>
            <div className="divide-y divide-border rounded-md border border-border">
              {recentTalepler.slice(0, 5).map((talep) => (
                <Link
                  key={talep.id}
                  href={`/talepler/${talep.id}`}
                  className="flex items-center justify-between px-2 py-1.5 text-xs hover:bg-[#f8fafc]"
                >
                  <span className="min-w-0 flex-1 truncate font-medium text-[#0f172a]">{talep.title}</span>
                  <span className="ml-2 shrink-0 text-muted-foreground">{statusLabels[talep.status] ?? talep.status}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <Link
          href="/talepler"
          className="mt-1 block text-center text-xs font-medium text-[#093657] underline underline-offset-2"
        >
          Tüm Talepler
        </Link>
      </CardContent>
    </Card>
  );
}
