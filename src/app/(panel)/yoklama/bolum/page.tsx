import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { AttendanceBulkActions } from "@/components/attendance/attendance-bulk-actions";
import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { PageHeader } from "@/components/layout/page-header";
import { StudentAvatar } from "@/components/students/student-avatar";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireAuth } from "@/lib/auth";
import { updateDepartmentAttendanceAction } from "@/lib/attendance/actions";
import { attendanceRecordStatusLabelsByType, attendanceTypeDescriptions, attendanceTypeLabels, attendanceTypes } from "@/lib/attendance/constants";
import { canManageAttendance } from "@/lib/attendance/permissions";
import { getDepartmentAttendanceDetail } from "@/lib/attendance/queries";
import { cn } from "@/lib/utils";

type DepartmentAttendancePageProps = {
  searchParams: Promise<{
    departmentId?: string;
    date?: string;
    attendanceType?: string;
    success?: string;
  }>;
};

export default async function DepartmentAttendancePage({ searchParams }: DepartmentAttendancePageProps) {
  const query = await searchParams;
  const { profile } = await requireAuth();

  if (!canManageAttendance(profile)) {
    redirect("/yoklama?error=unauthorized");
  }

  const departmentId = query.departmentId ?? "";
  const attendanceDate = query.date ?? "";
  const attendanceType = normalizeType(query.attendanceType);

  if (!departmentId || !attendanceDate) {
    notFound();
  }

  const detail = await getDepartmentAttendanceDetail(profile, departmentId, attendanceDate, attendanceType);

  if (!detail) {
    notFound();
  }

  let currentClassName = "";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          eyebrow="Bölüm Yoklaması"
          title={`${detail.department?.name ?? "Bölüm"} - ${attendanceTypeLabels[attendanceType]}`}
          description={attendanceTypeDescriptions[attendanceType]}
        />
        <Link href="/yoklama" className={cn(buttonVariants({ variant: "outline" }))}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Yoklama
        </Link>
      </div>

      {query.success ? (
        <Card>
          <CardContent className="px-4 py-3 text-sm text-[#093657]">
            {query.success === "created" ? "Bölüm yoklaması oluşturuldu." : "Bölüm yoklaması güncellendi."}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Talebe Listesi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-4">
            <Stat label="Sınıf Oturumu" value={detail.sessions.length} />
            <Stat label="Talebe" value={detail.records.length} />
            <Stat label="Var" value={detail.records.filter((record) => record.status === "present").length} />
            <Stat label="Yok" value={detail.records.filter((record) => record.status === "absent").length} />
          </div>
        </CardContent>
      </Card>

      <form action={updateDepartmentAttendanceAction} className="space-y-4">
        <input type="hidden" name="department_id" value={departmentId} />
        <input type="hidden" name="attendance_date" value={attendanceDate} />
        <input type="hidden" name="attendance_type" value={attendanceType} />

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>Toplu Yoklama Girişi</CardTitle>
              <AttendanceBulkActions
                allowedStatuses={Object.keys(attendanceRecordStatusLabelsByType[attendanceType])}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-6">
            {detail.records.map((record) => {
              const className = record.session.course_class?.name ?? "Sınıf";
              const showClassHeader = className !== currentClassName;
              currentClassName = className;

              return (
                <div key={record.id}>
                  {showClassHeader ? (
                    <div className="mb-2 mt-4 rounded-md border border-border bg-[#f8fafc] px-3 py-2 text-sm font-medium text-[#093657] first:mt-0">
                      {className}
                    </div>
                  ) : null}
                  <div data-attendance-row="true" className="rounded-md border border-border bg-white p-3">
                    <input type="hidden" name="record_id" value={record.id} />
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex items-start gap-3">
                        <StudentAvatar name={record.student?.full_name ?? "Talebe"} photoUrl={record.student?.photo_url ?? null} size="sm" />
                        <div className="min-w-0">
                          <p className="font-medium text-[#093657]">{record.student?.full_name ?? "-"}</p>
                          <p className="text-xs text-muted-foreground">{record.student?.school_class ?? "-"}</p>
                        </div>
                      </div>
                      <div className="grid gap-2 md:min-w-[360px] md:grid-cols-[160px_minmax(0,1fr)]">
                        <select
                          data-attendance-status="true"
                          name={`status_${record.id}`}
                          defaultValue={record.status}
                          className="h-9 rounded-md border border-border bg-background px-3 text-sm"
                        >
                          {Object.entries(attendanceRecordStatusLabelsByType[attendanceType]).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                        <Input name={`note_${record.id}`} defaultValue={record.note ?? ""} placeholder="Not" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <FormSubmitButton pendingLabel="Kaydediliyor...">Bölüm Yoklamasını Kaydet</FormSubmitButton>
        </div>
      </form>
    </div>
  );
}

function normalizeType(value?: string) {
  return value && attendanceTypes.includes(value as (typeof attendanceTypes)[number]) ? (value as (typeof attendanceTypes)[number]) : "daily";
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-[#f8fafc] p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-[#093657]">{value}</p>
    </div>
  );
}
