import Link from "next/link";
import { CalendarCheck } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getTodayDuties } from "@/lib/tasks/duty-queries";

export async function DutyDashboardCard() {
  const { teachers, students } = await getTodayDuties();

  const totalDuties = teachers.length + students.length;

  return (
    <Card className="bg-white">
      <CardHeader className="border-b border-border pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm">Bugünün Nöbetçileri</CardTitle>
            <CardDescription className="text-xs">
              {totalDuties > 0
                ? `${totalDuties} kişi nöbetçi olarak atandı`
                : "Bugün için nöbetçi atanmamış"}
            </CardDescription>
          </div>
          <CalendarCheck className="size-5 text-muted-foreground" aria-hidden />
        </div>
      </CardHeader>
      <CardContent className="divide-y divide-border p-0">
        {teachers.length > 0 ? (
          <div className="px-4 py-3">
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Hocalar</p>
            <ul className="space-y-1">
              {teachers.map((t) => (
                <li key={t.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-[#0f172a]">{t.personName}</span>
                  {t.note ? <span className="text-xs text-muted-foreground">{t.note}</span> : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {students.length > 0 ? (
          <div className="px-4 py-3">
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Talebeler</p>
            <ul className="space-y-1">
              {students.map((s) => (
                <li key={s.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-[#0f172a]">{s.studentName}</span>
                  <span className="text-xs text-muted-foreground">{s.className}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {totalDuties === 0 ? (
          <div className="px-4 py-6">
            <EmptyState title="Bugün nöbetçi bulunmuyor." />
          </div>
        ) : null}

        <div className="border-t border-border px-4 py-2">
          <Link
            href="/gorevler/nobetci"
            className="text-xs font-medium text-[#093657] hover:underline"
          >
            Nöbetçi yönetimine git →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
