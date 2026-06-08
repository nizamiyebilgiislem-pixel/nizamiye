import { formatScheduleTime, weeklyScheduleDayLabels } from "@/components/schedule/weekly-schedule-preview";
import type { EducationClassRow, WeeklyScheduleSlotWithRelations } from "@/lib/education/queries";

type PrintableWeeklyScheduleProps = {
  classRow: EducationClassRow;
  slots: WeeklyScheduleSlotWithRelations[];
  generatedAt?: Date;
};

export function PrintableWeeklySchedule({
  classRow,
  slots,
  generatedAt = new Date(),
}: PrintableWeeklyScheduleProps) {
  const periods = Array.from(new Set([1, 2, 3, 4, 5, 6, 7, 8, ...slots.map((slot) => slot.period_no)])).sort((left, right) => left - right);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#093657]">Nizamiye Öğrenci Sistemi</p>
        <h1 className="text-3xl font-semibold text-[#093657]">{classRow.name} Ders Programı</h1>
        <div className="grid gap-2 text-sm text-slate-600 md:grid-cols-2">
          <p>Bölüm: {classRow.department?.name ?? "-"}</p>
          <p>Sınıf Hocası: {classRow.class_teacher?.full_name ?? "Atanmadı"}</p>
          <p>Tarih: {new Intl.DateTimeFormat("tr-TR", { dateStyle: "long" }).format(generatedAt)}</p>
          <p>Durum: {slots.length > 0 ? "Program oluşturuldu" : "Program yok"}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-md border border-slate-200">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border-b border-r border-slate-200 bg-slate-50 px-3 py-3 text-left font-semibold text-[#093657]">Ders Saati</th>
              {Object.entries(weeklyScheduleDayLabels).map(([value, label]) => (
                <th key={value} className="border-b border-r border-slate-200 bg-slate-50 px-3 py-3 text-left font-semibold text-[#093657] last:border-r-0">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periods.map((periodNo) => (
              <tr key={periodNo} className="align-top">
                <td className="border-b border-r border-slate-200 px-3 py-3 font-medium text-[#093657]">#{periodNo}</td>
                {Array.from({ length: 7 }, (_, index) => index + 1).map((dayOfWeek) => {
                  const slot = slots.find((item) => item.day_of_week === dayOfWeek && item.period_no === periodNo) ?? null;

                  return (
                    <td key={dayOfWeek} className="border-b border-r border-slate-200 px-3 py-3 align-top last:border-r-0">
                      {slot ? (
                        <div className="space-y-1">
                          <p className="font-semibold text-[#093657]">{slot.course?.name ?? "-"}</p>
                          <p className="text-slate-600">{slot.teacher?.full_name ?? "Hoca atanmadı"}</p>
                          <p className="text-slate-500">
                            {formatScheduleTime(slot.start_time)} - {formatScheduleTime(slot.end_time)}
                          </p>
                          {slot.room ? <p className="text-slate-500">Oda: {slot.room}</p> : null}
                        </div>
                      ) : (
                        <span className="text-slate-300">-</span>
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
  );
}
