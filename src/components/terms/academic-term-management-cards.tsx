import { CalendarCheck, CalendarClock, CalendarDays, History } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { AcademicTermManagementSummary } from "@/lib/terms/management-queries";

export function AcademicTermManagementCards({ summary }: { summary: AcademicTermManagementSummary }) {
  const cards = [
    {
      label: "Aktif Dönem",
      value: summary.activeTermName ?? "Yok",
      icon: CalendarCheck,
    },
    {
      label: "Toplam Dönem",
      value: String(summary.totalTermCount),
      icon: CalendarDays,
    },
    {
      label: "Kapalı Dönem",
      value: String(summary.closedTermCount),
      icon: History,
    },
    {
      label: "Son Kapanış Tarihi",
      value: formatDate(summary.lastClosureDate),
      icon: CalendarClock,
    },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.label} size="sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Icon className="size-4 text-[#47758f]" aria-hidden="true" />
                <p className="text-xs font-medium uppercase text-muted-foreground">{card.label}</p>
              </div>
              <p className="mt-2 text-xl font-semibold text-[#093657]">{card.value}</p>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}

function formatDate(value: string | null) {
  return value ? new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(new Date(value)) : "-";
}
