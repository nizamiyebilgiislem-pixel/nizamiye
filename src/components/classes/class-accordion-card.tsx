import Link from "next/link";
import { BookOpen, CalendarDays, ChevronDown, UsersRound } from "lucide-react";

import { RichProfileCard } from "@/components/profiles/rich-profile-card";
import { StudentCompactCard } from "@/components/students/student-compact-card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ClassAnalytics } from "@/lib/departments/analytics";

type ClassAccordionCardProps = {
  classRow: ClassAnalytics;
  previewStudentCount?: number;
  showDepartment?: boolean;
  showStudentsLink?: boolean;
  className?: string;
  readOnly?: boolean;
};

export function ClassAccordionCard({
  classRow,
  previewStudentCount = 8,
  showDepartment = false,
  showStudentsLink = true,
  className,
  readOnly = false,
}: ClassAccordionCardProps) {
  const previewStudents = classRow.students.slice(0, previewStudentCount);

  return (
    <details className={cn("group overflow-hidden rounded-md border border-border bg-white shadow-sm", className)}>
      <summary className="flex cursor-pointer list-none flex-col gap-3 px-4 py-4 marker:hidden lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Link href={`/siniflar/${classRow.id}`} className="truncate text-base font-semibold text-[#093657] hover:underline">{classRow.name}</Link>
            <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true" />
          </div>
          {showDepartment && classRow.department?.name ? <p className="mt-1 text-sm text-muted-foreground">{classRow.department.name}</p> : null}
        </div>
        <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-4 lg:min-w-[520px]">
          <SummaryStat icon={UsersRound} label="Talebe" value={classRow.active_student_count} />
          <SummaryStat icon={BookOpen} label="Başarı" value={classRow.success_average ? classRow.success_average.toLocaleString("tr-TR") : "-"} />
          <SummaryStat icon={CalendarDays} label="Program" value={classRow.has_schedule ? "Var" : "Yok"} />
          <SummaryStat icon={BookOpen} label="Ders" value={classRow.active_course_count} />
        </div>
      </summary>

      <div className="border-t border-border p-4">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <RichProfileCard
            profile={classRow.class_teacher}
            title="Sınıf Hocası"
            href={classRow.class_teacher ? `/hocalar/${classRow.class_teacher.id}` : undefined}
            emptyText="Sınıf hocası atanmadı"
          />

          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Info label="Aktif talebe" value={String(classRow.active_student_count)} />
              <Info label="Ders sayısı" value={String(classRow.active_course_count)} />
              <Info label="Doluluk" value={`%${classRow.occupancy_percent}`} />
              <Info label="Başarı" value={classRow.success_average ? classRow.success_average.toLocaleString("tr-TR") : "-"} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={`/siniflar/${classRow.id}`} className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}>
                Sınıf Detayı
              </Link>
              <Link href={`/egitim-planlama/ders-programi/${classRow.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                Ders Programı
              </Link>
              {showStudentsLink && !readOnly ? (
                <Link href={`/talebeler?class=${classRow.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                  Tümünü Gör
                </Link>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-[#093657]">Aktif Talebeler</p>
            {classRow.students.length > previewStudentCount ? (
              <Link href={`/talebeler?class=${classRow.id}`} className="text-sm font-medium text-[#093657] hover:underline">
                Tümünü Gör
              </Link>
            ) : null}
          </div>
          {previewStudents.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {previewStudents.map((student) => (
                <StudentCompactCard key={student.id} student={student} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Bu sınıfta aktif talebe bulunmuyor.</p>
          )}
        </div>
      </div>
    </details>
  );
}

function SummaryStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UsersRound;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-md border border-[#093657]/10 bg-[#f8fafc] px-3 py-2">
      <div className="flex items-center gap-2">
        <Icon className="size-3.5 text-[#093657]" aria-hidden="true" />
        <span className="text-xs uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-1 font-semibold text-[#093657]">{value}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-[#f8fafc] p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-base font-semibold text-[#093657]">{value}</p>
    </div>
  );
}
