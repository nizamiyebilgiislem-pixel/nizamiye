import { notFound } from "next/navigation";

import { PrintScheduleButton } from "@/components/schedule/print-schedule-button";
import { PrintableWeeklySchedule } from "@/components/schedule/printable-weekly-schedule";
import { requireAuth } from "@/lib/auth";
import { getEducationScheduleData } from "@/lib/education/queries";

type PrintableSchedulePageProps = {
  params: Promise<{ id: string }>;
};

export default async function PrintableSchedulePage({ params }: PrintableSchedulePageProps) {
  const { id } = await params;
  const { profile } = await requireAuth();
  const data = await getEducationScheduleData(profile, id);

  if (!data) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 print:bg-white print:p-0">
      <div className="mx-auto max-w-6xl space-y-6 rounded-md border border-border bg-white p-6 shadow-sm print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none">
        <div className="flex items-center justify-end print:hidden">
          <PrintScheduleButton />
        </div>
        <PrintableWeeklySchedule classRow={data.classRow} slots={data.slots} />
      </div>
    </div>
  );
}
