import Link from "next/link";
import { notFound } from "next/navigation";

import { EducationErrorMessage } from "@/components/education/education-error-message";
import { PageHeader } from "@/components/layout/page-header";
import { RichProfileCard } from "@/components/profiles/rich-profile-card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { createScheduleSlotAction, updateScheduleSlotAction } from "@/lib/education/actions";
import { canManageClassSchedule } from "@/lib/education/permissions";
import { getEducationScheduleData } from "@/lib/education/queries";
import { requireAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { formatScheduleTime, weeklyScheduleDayLabels } from "@/components/schedule/weekly-schedule-preview";

type Props = {
  params: Promise<{ classId: string }>;
  searchParams: Promise<{ error?: string; saved?: string; day?: string; period?: string; slotId?: string }>;
};

export default async function EducationSchedulePage({ params, searchParams }: Props) {
  const [{ classId }, query] = await Promise.all([params, searchParams]);
  const { profile } = await requireAuth();
  const data = await getEducationScheduleData(profile, classId);

  if (!data) {
    notFound();
  }

  const canManage = canManageClassSchedule(profile, data.classRow);
  const activeClassCourses = data.classCourses.filter((classCourse) => classCourse.is_active);
  const shouldScopeSlotsToTeacher = !canManage && profile.role === "hoca";
  const visibleSlots = shouldScopeSlotsToTeacher
    ? data.slots.filter((slot) => data.classRow.class_teacher_id === profile.id || slot.class_course?.teacher_id === profile.id)
    : data.slots;
  const selectedDay = clampDay(Number(query.day ?? 1));
  const selectedPeriod = Math.max(1, Number(query.period ?? 1) || 1);
  const selectedSlot = query.slotId ? visibleSlots.find((slot) => slot.id === query.slotId) ?? null : null;
  const formSlot = selectedSlot ?? null;
  const periods = Array.from(new Set([1, 2, 3, 4, 5, 6, 7, 8, selectedPeriod, ...visibleSlots.map((slot) => slot.period_no)])).sort((left, right) => left - right);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Akademik"
        title={`${data.classRow.name} Ders Programı`}
        description={`${data.classRow.department?.name ?? "-"} · Sınıf hocası: ${data.classRow.class_teacher?.full_name ?? "Atanmadı"}`}
      />

      <EducationErrorMessage error={query.error} saved={query.saved} />
      <EducationErrorMessage error={data.loadError ?? undefined} />

      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle>Sınıf Bilgisi</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 p-4 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="grid gap-3 sm:grid-cols-2">
            <Info label="Sınıf" value={data.classRow.name} />
            <Info label="Bölüm" value={data.classRow.department?.name ?? "-"} />
          </div>
          <RichProfileCard
            profile={data.classRow.class_teacher}
            title="Sınıf Hocası"
            href={data.classRow.class_teacher ? `/hocalar/${data.classRow.class_teacher.id}` : undefined}
            emptyText="Sınıf hocası atanmadı"
          />
        </CardContent>
      </Card>

      {canManage ? (
        <Card>
          <CardHeader className="border-b border-border">
            <CardTitle>{formSlot ? "Ders Programı Düzenle" : "Ders Ekle"}</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <form action={formSlot ? updateScheduleSlotAction : createScheduleSlotAction} className="grid gap-3 lg:grid-cols-[140px_140px_minmax(0,1.4fr)_120px_120px_120px_minmax(0,1fr)_auto]">
              {formSlot ? <input type="hidden" name="id" value={formSlot.id} /> : null}
              <input type="hidden" name="class_id" value={data.classRow.id} />
              <NativeSelect name="day_of_week" defaultValue={String(formSlot?.day_of_week ?? selectedDay)} className="h-10 rounded-md border border-border bg-background px-3 text-sm shadow-sm">
                {Object.entries(weeklyScheduleDayLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </NativeSelect>
              <input
                name="period_no"
                type="number"
                min={1}
                defaultValue={formSlot?.period_no ?? selectedPeriod}
                className="h-10 rounded-md border border-border bg-background px-3 text-sm shadow-sm"
              />
              {activeClassCourses.length > 0 ? (
                <NativeSelect name="class_course_id" required defaultValue={formSlot?.class_course_id ?? activeClassCourses[0]?.id ?? ""} className="h-10 rounded-md border border-border bg-background px-3 text-sm shadow-sm">
                  <option value="">Ders seçin</option>
                  {activeClassCourses.map((classCourse) => (
                    <option key={classCourse.id} value={classCourse.id}>
                      {classCourse.course?.name ?? "-"}
                      {classCourse.teacher?.full_name ? ` · ${classCourse.teacher.full_name}` : " · Hoca atanmadı"}
                    </option>
                  ))}
                </NativeSelect>
              ) : (
                <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 lg:col-span-3">
                  Ders programı için önce sınıfa aktif ders atanmalıdır.
                </div>
              )}
            <Input name="start_time" type="time" defaultValue={formSlot?.start_time ?? ""} className="h-10" />
            <Input name="end_time" type="time" defaultValue={formSlot?.end_time ?? ""} className="h-10" />
            <Input name="room" defaultValue={formSlot?.room ?? ""} placeholder="Derslik" className="h-10" />
            <Input name="note" defaultValue={formSlot?.note ?? ""} placeholder="Not" className="h-10" />
              <Button type="submit" className="lg:self-start" disabled={activeClassCourses.length === 0}>
                {formSlot ? "Güncelle" : "Kaydet"}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-4 text-sm text-muted-foreground">
            Bu sayfa salt okunur görüntüleme modundadır. Ders programında değişiklik yapma yetkiniz bulunmuyor.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle>Haftalık Program</CardTitle>
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
                        const slot = visibleSlots.find((item) => item.day_of_week === dayOfWeek && item.period_no === periodNo) ?? null;

                        return (
                          <td key={dayOfWeek} className="border-b border-border px-2 py-2">
                            {slot ? (
                              <div className="rounded-md border border-border bg-white p-3 shadow-sm">
                                <p className="font-semibold text-[#093657]">{slot.course?.name ?? "-"}</p>
                                {slot.teacher ? (
                                  <div className="mt-3">
                                    <RichProfileCard
                                      profile={slot.teacher}
                                      href={`/hocalar/${slot.teacher.id}`}
                                      compact
                                      className="border-0 bg-transparent p-0 shadow-none hover:bg-transparent"
                                    />
                                  </div>
                                ) : (
                                  <p className="mt-1 text-xs text-muted-foreground">Hoca atanmadı</p>
                                )}
                                <p className="mt-2 text-xs text-muted-foreground">
                                  {formatScheduleTime(slot.start_time)} - {formatScheduleTime(slot.end_time)}
                                </p>
                                {slot.room ? <p className="text-xs text-muted-foreground">Oda: {slot.room}</p> : null}
                                {slot.note ? <p className="text-xs text-muted-foreground">{slot.note}</p> : null}
                                {canManage ? (
                                  <div className="mt-3 flex justify-end">
                                    <Link
                                      href={`/egitim-planlama/ders-programi/${data.classRow.id}?slotId=${slot.id}`}
                                      className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
                                    >
                                      Düzenle
                                    </Link>
                                  </div>
                                ) : null}
                              </div>
                            ) : canManage ? (
                              <Link
                                href={`/egitim-planlama/ders-programi/${data.classRow.id}?day=${dayOfWeek}&period=${periodNo}`}
                                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full")}
                              >
                                Ders Ekle
                              </Link>
                            ) : (
                              <div className="min-h-24 rounded-md border border-dashed border-border bg-[#f8fafc]" />
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
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-[#f8fafc] p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#093657]">{value}</p>
    </div>
  );
}

function clampDay(value: number) {
  if (Number.isNaN(value)) {
    return 1;
  }

  return Math.min(7, Math.max(1, value));
}
