import type { AttendanceRecordStatus, AttendanceType } from "@/types/database";

export const attendanceTypes: AttendanceType[] = ["daily", "fajr", "dhuhr", "asr", "maghrib", "isha"];

export const attendanceTypeLabels: Record<AttendanceType, string> = {
  daily: "Günlük Yoklama",
  fajr: "Sabah Namazı",
  dhuhr: "Öğle Namazı",
  asr: "İkindi Namazı",
  maghrib: "Akşam Namazı",
  isha: "Yatsı Namazı",
};

export const attendanceTypeDescriptions: Record<AttendanceType, string> = {
  daily: "Bu sınıf için seçilen tarihte günlük sınıf yoklaması alınır.",
  fajr: "Bu sınıf için seçilen tarihte sabah namazı yoklaması alınır.",
  dhuhr: "Bu sınıf için seçilen tarihte öğle namazı yoklaması alınır.",
  asr: "Bu sınıf için seçilen tarihte ikindi namazı yoklaması alınır.",
  maghrib: "Bu sınıf için seçilen tarihte akşam namazı yoklaması alınır.",
  isha: "Bu sınıf için seçilen tarihte yatsı namazı yoklaması alınır.",
};

export const attendanceRecordStatusLabelsByType: Record<AttendanceType, Record<AttendanceRecordStatus, string>> = {
  daily: {
    present: "Var",
    absent: "Yok",
    excused: "İzinli",
    late: "Geç",
  },
  fajr: {
    present: "Katıldı",
    absent: "Katılmadı",
    excused: "Mazeretli",
    late: "Geç Katıldı",
  },
  dhuhr: {
    present: "Katıldı",
    absent: "Katılmadı",
    excused: "Mazeretli",
    late: "Geç Katıldı",
  },
  asr: {
    present: "Katıldı",
    absent: "Katılmadı",
    excused: "Mazeretli",
    late: "Geç Katıldı",
  },
  maghrib: {
    present: "Katıldı",
    absent: "Katılmadı",
    excused: "Mazeretli",
    late: "Geç Katıldı",
  },
  isha: {
    present: "Katıldı",
    absent: "Katılmadı",
    excused: "Mazeretli",
    late: "Geç Katıldı",
  },
};

export const attendanceStatusLabels: Record<AttendanceRecordStatus, string> = {
  present: "Katıldı",
  absent: "Katılmadı",
  excused: "Mazeretli",
  late: "Geç Katıldı",
};

export const prayerAttendanceTypes: AttendanceType[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
