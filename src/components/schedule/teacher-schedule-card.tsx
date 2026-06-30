import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TeacherScheduleSlot } from "@/lib/education/queries";
import { formatScheduleTime, weeklyScheduleDayLabels } from "@/components/schedule/weekly-schedule-preview";

type TeacherScheduleCardProps = {
  slots: TeacherScheduleSlot[];
};

export function TeacherScheduleCard({ slots }: TeacherScheduleCardProps) {
  if (slots.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ders Programı</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Program bulunamadı.</p>
        </CardContent>
      </Card>
    );
  }

  const grouped = slots.reduce(
    (acc, slot) => {
      const day = slot.day_of_week;
      if (!acc[day]) acc[day] = [];
      acc[day].push(slot);
      return acc;
    },
    {} as Record<number, TeacherScheduleSlot[]>,
  );

  const sortedDays = Object.keys(grouped)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ders Programı</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedDays.map((day) => (
          <div key={day}>
            <h4 className="mb-2 text-sm font-semibold text-[#093657]">{weeklyScheduleDayLabels[day]}</h4>
            <div className="space-y-1.5">
              {grouped[day]
                .sort((a, b) => a.period_no - b.period_no)
                .map((slot) => (
                  <div
                    key={slot.id}
                    className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-muted-foreground">#{slot.period_no}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatScheduleTime(slot.start_time)}-{formatScheduleTime(slot.end_time)}
                    </span>
                    <span className="font-medium">{slot.course?.name ?? "-"}</span>
                    <span className="text-xs text-muted-foreground">({slot.class_name})</span>
                    {slot.room ? <span className="text-xs text-muted-foreground">Oda: {slot.room}</span> : null}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
