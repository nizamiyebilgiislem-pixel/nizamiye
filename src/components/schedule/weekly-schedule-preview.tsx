import Link from "next/link";

import { ProfileAvatar } from "@/components/profiles/profile-avatar";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { EducationClassRow, WeeklyScheduleSlotWithRelations } from "@/lib/education/queries";
import { cn } from "@/lib/utils";

export const weeklyScheduleDayLabels: Record<number, string> = {
  1: "Pazartesi",
  2: "Salı",
  3: "Çarşamba",
  4: "Perşembe",
  5: "Cuma",
  6: "Cumartesi",
  7: "Pazar",
};

type WeeklySchedulePreviewProps = {
  classRow: EducationClassRow;
  slots: WeeklyScheduleSlotWithRelations[];
  showActions?: boolean;
  printHref?: string;
  scheduleHref?: string;
  className?: string;
  readOnly?: boolean;
};

export function WeeklySchedulePreview({
  classRow,
  slots,
  showActions = true,
  printHref,
  scheduleHref,
  className,
}: WeeklySchedulePreviewProps) {
  if (slots.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="border-b border-border">
          <CardTitle>Ders Programı Özeti</CardTitle>
          <CardDescription>Program henüz oluşturulmadı.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4">
          <p className="text-sm leading-6 text-muted-foreground">Bu sınıf için henüz haftalık ders programı oluşturulmamış.</p>
          {showActions && scheduleHref ? (
            <Link href={scheduleHref} className={cn(buttonVariants({ variant: "secondary" }))}>
              Ders Programı
            </Link>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  const periods = Array.from(new Set([1, 2, 3, 4, 5, 6, 7, 8, ...slots.map((slot) => slot.period_no)])).sort((left, right) => left - right);

  return (
    <Card className={className}>
      <CardHeader className="border-b border-border">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Ders Programı Özeti</CardTitle>
            <CardDescription>{classRow.name} haftalık program görünümü.</CardDescription>
          </div>
          {showActions ? (
            <div className="flex flex-wrap gap-2">
              {scheduleHref ? (
                <Link href={scheduleHref} className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}>
                  Ders Programı
                </Link>
              ) : null}
              {printHref ? (
                <Link href={printHref} target="_blank" rel="noreferrer" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                  PDF İndir
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <div className="min-w-[1100px]">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border-b border-border bg-[#f8fafc] px-3 py-3 text-left font-medium text-[#093657]">Ders Saati</th>
                  {Object.entries(weeklyScheduleDayLabels).map(([value, label]) => (
                    <th key={value} className="border-b border-border bg-[#f8fafc] px-3 py-3 text-left font-medium text-[#093657]">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {periods.map((periodNo) => (
                  <tr key={periodNo} className="align-top">
                    <td className="border-b border-border px-3 py-3 font-medium text-[#093657]">#{periodNo}</td>
                    {Array.from({ length: 7 }, (_, index) => index + 1).map((dayOfWeek) => {
                      const slot = slots.find((item) => item.day_of_week === dayOfWeek && item.period_no === periodNo) ?? null;

                      return (
                        <td key={dayOfWeek} className="border-b border-border px-2 py-2">
                          {slot ? (
                            <div className="min-h-28 rounded-md border border-border bg-white p-3 shadow-sm">
                              <p className="font-semibold text-[#093657]">{slot.course?.name ?? "-"}</p>
                              {slot.teacher ? (
                                <div className="mt-2 flex items-center gap-2">
                                  <ProfileAvatar name={slot.teacher.full_name} photoUrl={slot.teacher.photo_url} size="sm" />
                                  <span className="min-w-0 truncate text-xs text-muted-foreground">{slot.teacher.full_name}</span>
                                </div>
                              ) : (
                                <p className="mt-2 text-xs text-muted-foreground">Hoca atanmadı</p>
                              )}
                              <p className="mt-2 text-xs text-muted-foreground">
                                {formatScheduleTime(slot.start_time)} - {formatScheduleTime(slot.end_time)}
                              </p>
                              {slot.room ? <p className="text-xs text-muted-foreground">Oda: {slot.room}</p> : null}
                            </div>
                          ) : (
                            <div className="min-h-28 rounded-md border border-dashed border-border bg-[#f8fafc]" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function formatScheduleTime(value: string | null) {
  return value ?? "-";
}
