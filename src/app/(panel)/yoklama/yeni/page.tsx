import { notFound } from "next/navigation";

import { AttendanceSessionCreateForm } from "@/components/attendance/attendance-session-create-form";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
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
        <Card><CardContent className="p-5 text-center text-sm text-muted-foreground">Bu işlem için yetkiniz bulunmamaktadır.</CardContent></Card>
      </div>
    );
  }

  const { classes } = await getAttendanceFilterOptions(profile);
  const activeClasses = classes.filter((classRow) => classRow.is_active);

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
        defaultDate={query.date}
        defaultClassId={query.classId}
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