import { notFound } from "next/navigation";

import { AttendanceSessionCreateForm } from "@/components/attendance/attendance-session-create-form";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireAuth } from "@/lib/auth";
import { canManageAttendance } from "@/lib/attendance/permissions";
import { getAttendanceFilterOptions } from "@/lib/attendance/queries";
import { attendanceTypes } from "@/lib/attendance/constants";

type AttendanceNewPageProps = {
  searchParams: Promise<{ attendanceType?: string; date?: string; classId?: string }>;
};

export default async function AttendanceNewPage({ searchParams }: AttendanceNewPageProps) {
  const query = await searchParams;
  const { profile } = await requireAuth();

  if (!canManageAttendance(profile)) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Yeni Yoklama" title="Yetkisiz erişim" description="Yoklama oluşturma yetkiniz bulunmamaktadır." />
        <EmptyState title="Bu işlem için yetkiniz bulunmamaktadır." />
      </div>
    );
  }

  const { classes, departments } = await getAttendanceFilterOptions(profile);
  const activeClasses = classes.filter((classRow) => classRow.is_active);
  const bulkDepartment = profile.role === "bolum_muduru"
    ? departments.find((department) => department.id === profile.department_id)
    : null;

  if (activeClasses.length === 0) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Yeni Yoklama"
        title={titleForType(query.attendanceType)}
        description={descriptionForType(query.attendanceType)}
      />
      <Card>
        <CardContent className="px-4 py-3 text-sm text-muted-foreground">
          Aynı sınıf, aynı tarih ve aynı yoklama türü zaten varsa sistem sizi mevcut yoklama kaydına yönlendirir.
        </CardContent>
      </Card>
      <AttendanceSessionCreateForm
        classes={activeClasses}
        defaultAttendanceType={normalizeType(query.attendanceType)}
        defaultDate={query.date ?? getTodayDateString()}
        defaultClassId={query.classId}
        bulkDepartmentId={bulkDepartment?.id}
        bulkDepartmentName={bulkDepartment?.name}
      />
    </div>
  );
}

function normalizeType(value?: string) {
  return value && attendanceTypes.includes(value as (typeof attendanceTypes)[number]) ? (value as (typeof attendanceTypes)[number]) : "daily";
}

function titleForType(value?: string) {
  const type = normalizeType(value);
  const map = {
    daily: "Günlük Yoklama",
    fajr: "Sabah Namazı Yoklaması",
    dhuhr: "Öğle Namazı Yoklaması",
    asr: "İkindi Namazı Yoklaması",
    maghrib: "Akşam Namazı Yoklaması",
    isha: "Yatsı Namazı Yoklaması",
  } as const;

  return map[type];
}

function descriptionForType(value?: string) {
  const type = normalizeType(value);
  const map = {
    daily: "Bu sınıf için seçilen tarihte günlük sınıf yoklaması alınır.",
    fajr: "Bu sınıf için seçilen tarihte sabah namazı yoklaması alınır.",
    dhuhr: "Bu sınıf için seçilen tarihte öğle namazı yoklaması alınır.",
    asr: "Bu sınıf için seçilen tarihte ikindi namazı yoklaması alınır.",
    maghrib: "Bu sınıf için seçilen tarihte akşam namazı yoklaması alınır.",
    isha: "Bu sınıf için seçilen tarihte yatsı namazı yoklaması alınır.",
  } as const;

  return map[type];
}

function getTodayDateString() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "00";
  const day = parts.find((part) => part.type === "day")?.value ?? "00";

  return `${year}-${month}-${day}`;
}
