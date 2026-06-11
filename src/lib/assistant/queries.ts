import type { ProfileRow } from "@/types/database";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAssistantVisibleClassIds } from "./access";
import type { IntentId, IntentResult } from "./types";
import { getWeather } from "./weather";
import { getPrayerTimes } from "./prayer-times";
import { webSearch } from "./web-search";
import { getStudentFullReport } from "./student-query";

function getTurkeyDate(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(new Date());
}

export async function handleAttendanceToday(profile: ProfileRow): Promise<IntentResult> {
  const supabase = createSupabaseAdminClient();
  const today = getTurkeyDate();
  const classIds = await getAssistantVisibleClassIds(profile);

  if (classIds?.length === 0) {
    return { answer: "Bu işlem için yetkiniz bulunmamaktadır. Yetki işlemleri için Emin Nusret Polat ile iletişime geçebilirsiniz." };
  }

  let query = supabase
    .from("attendance_sessions")
    .select("*", { count: "exact", head: true })
    .eq("attendance_date", today);

  if (classIds) query = query.in("class_id", classIds);

  const { count } = await query;

  if (count && count > 0) {
    return { answer: `✅ Bugün ${count} sınıfta yoklama alınmış.` };
  }
  return { answer: "❌ Bugün henüz hiçbir sınıfta yoklama alınmamış." };
}

export async function handleAttendanceClass(profile: ProfileRow, className: string): Promise<IntentResult> {
  const supabase = createSupabaseAdminClient();
  const today = getTurkeyDate();

  const { data: cls } = await supabase
    .from("classes")
    .select("id, name, department_id, class_teacher_id")
    .ilike("name", `%${className}%`)
    .maybeSingle();

  if (!cls) {
    return { answer: `"${className}" adında bir sınıf bulamadım.` };
  }

  const classIds = await getAssistantVisibleClassIds(profile);
  if (classIds && !classIds.includes(cls.id)) {
    return { answer: "Bu işlem için yetkiniz bulunmamaktadır. Yetki işlemleri için Emin Nusret Polat ile iletişime geçebilirsiniz." };
  }

  const { count } = await supabase
    .from("attendance_sessions")
    .select("*", { count: "exact", head: true })
    .eq("attendance_date", today)
    .eq("class_id", cls.id);

  if (count && count > 0) {
    return { answer: `✅ ${cls.name} sınıfında bugün yoklama alınmış.` };
  }
  return { answer: `❌ ${cls.name} sınıfında bugün henüz yoklama alınmamış.` };
}

export async function handleInfirmaryToday(profile: ProfileRow): Promise<IntentResult> {
  const { getInfirmaryDashboardSummary } = await import("@/lib/infirmary/queries");
  const summary = await getInfirmaryDashboardSummary(profile);

  if (summary.todayCount > 0) {
    return {
      answer: `✅ Bugün ${summary.todayCount} revir kaydı yapılmış. Hastaneye sevk: ${summary.hospitalCount}, veli bilgisi: ${summary.parentInformedCount}.`,
    };
  }
  return { answer: "❌ Bugün henüz revir kaydı yok." };
}

export async function handleStudentNewToday(profile: ProfileRow): Promise<IntentResult> {
  const supabase = createSupabaseAdminClient();
  const today = getTurkeyDate();
  const classIds = await getAssistantVisibleClassIds(profile);

  if (classIds?.length === 0) {
    return { answer: "Bu işlem için yetkiniz bulunmamaktadır. Yetki işlemleri için Emin Nusret Polat ile iletişime geçebilirsiniz." };
  }

  let query = supabase
    .from("students")
    .select("*", { count: "exact", head: true })
    .gte("created_at", `${today}T00:00:00`)
    .lte("created_at", `${today}T23:59:59`);

  if (classIds) query = query.in("course_class_id", classIds);

  const { count } = await query;

  if (count && count > 0) {
    return { answer: `✅ Bugün ${count} yeni öğrenci kaydı yapılmış.` };
  }
  return { answer: "❌ Bugün yeni öğrenci kaydı yok." };
}

export async function handleScheduleClass(profile: ProfileRow, className: string): Promise<IntentResult> {
  const supabase = createSupabaseAdminClient();

  const { data: cls } = await supabase
    .from("classes")
    .select("id, name")
    .ilike("name", `%${className}%`)
    .maybeSingle();

  if (!cls) {
    return { answer: `"${className}" adında bir sınıf bulamadım.` };
  }

  const visibleClassIds = await getAssistantVisibleClassIds(profile);
  if (visibleClassIds && !visibleClassIds.includes(cls.id)) {
    return { answer: "Bu işlem için yetkiniz bulunmamaktadır. Yetki işlemleri için Emin Nusret Polat ile iletişime geçebilirsiniz." };
  }

  const dayNames: Record<number, string> = {
    1: "Pazartesi", 2: "Salı", 3: "Çarşamba", 4: "Perşembe",
    5: "Cuma", 6: "Cumartesi", 7: "Pazar",
  };

  const { data: classCourses } = await supabase
    .from("class_courses")
    .select("id, course_id")
    .eq("class_id", cls.id);

  if (!classCourses || classCourses.length === 0) {
    return { answer: `${cls.name} sınıfı için ders programı bulunamadı.` };
  }

  const courseIds = [...new Set(classCourses.map((cc) => cc.course_id))];
  const { data: courses } = await supabase
    .from("courses")
    .select("id, name")
    .in("id", courseIds);

  const courseNameMap = new Map(courses?.map((c) => [c.id, c.name]) ?? []);
  const ccMap = new Map(classCourses.map((cc) => [cc.id, cc]));

  const { data: slots } = await supabase
    .from("weekly_schedule_slots")
    .select("*")
    .eq("class_id", cls.id)
    .order("day_of_week")
    .order("period_no");

  if (!slots || slots.length === 0) {
    return { answer: `${cls.name} sınıfı için ders programı bulunamadı.` };
  }

  const grouped: Record<string, string[]> = {};
  for (const slot of slots) {
    const dayName = dayNames[slot.day_of_week] ?? `Gün ${slot.day_of_week}`;
    if (!grouped[dayName]) grouped[dayName] = [];
    const cc = ccMap.get(slot.class_course_id);
    const courseName = cc ? (courseNameMap.get(cc.course_id) ?? "Bilinmeyen Ders") : "Bilinmeyen Ders";
    grouped[dayName].push(`  ⏰ ${slot.period_no}. ders: ${courseName}`);
  }

  const lines = Object.entries(grouped).map(([day, lessons]) => `📅 ${day}\n${lessons.join("\n")}`);
  return { answer: `**${cls.name} Sınıfı Ders Programı**\n\n${lines.join("\n\n")}` };
}

export async function handleTasksToday(profile: ProfileRow): Promise<IntentResult> {
  const { getTaskCounts } = await import("@/lib/tasks/queries");
  const counts = await getTaskCounts(profile);

  const parts: string[] = [];
  if (counts.dueToday > 0) parts.push(`📋 Bugün teslim edilmesi gereken: ${counts.dueToday}`);
  if (counts.overdue > 0) parts.push(`⚠️ Gecikmiş görev: ${counts.overdue}`);
  if (counts.pending > 0) parts.push(`🕐 Bekleyen: ${counts.pending}`);
  if (counts.in_progress > 0) parts.push(`🔄 Devam eden: ${counts.in_progress}`);
  parts.push(`✅ Tamamlanan: ${counts.completed}`);

  return { answer: `**Görev Durumu**\n${parts.join(" | ")}` };
}

export async function handleLiveSessionToday(profile: ProfileRow): Promise<IntentResult> {
  const { getUpcomingSessions } = await import("@/lib/live-sessions/queries");
  const sessions = await getUpcomingSessions(profile);

  if (sessions.length === 0) {
    return { answer: "❌ Bugün için planlanmış canlı oturum bulunmuyor." };
  }

  const lines = sessions.slice(0, 5).map((s) =>
    `  ${s.title} (${new Date(s.start_time).toLocaleString("tr-TR", { hour: "2-digit", minute: "2-digit" })})`
  );
  return { answer: `✅ Bugün ${sessions.length} canlı oturum var.\n${lines.join("\n")}` };
}

export async function handleLibraryOverdue(_profile: ProfileRow): Promise<IntentResult> {
  if (!["admin", "genel_mudur", "kutuphane_gorevlisi", "bolum_muduru", "hoca", "destek_birim_muduru"].includes(_profile.role)) {
    return { answer: "Bu işlem için yetkiniz bulunmamaktadır. Yetki işlemleri için Emin Nusret Polat ile iletişime geçebilirsiniz." };
  }

  const { getLibraryDashboardData } = await import("@/lib/library/queries");
  const data = await getLibraryDashboardData();

  return {
    answer: data.overdueCount > 0
      ? `⚠️ ${data.overdueCount} adet gecikmiş kitap bulunuyor. (Ödünçte: ${data.borrowedCount}, müsait: ${data.availableCopies})`
      : `✅ Gecikmiş kitap bulunmuyor. (Ödünçte: ${data.borrowedCount}, müsait: ${data.availableCopies})`,
  };
}

export async function handleAnnouncementsActive(_profile: ProfileRow): Promise<IntentResult> {
  const { getAnnouncements } = await import("@/lib/duyurular/queries");
  const announcements = await getAnnouncements();

  if (announcements.length === 0) {
    return { answer: "❌ Henüz duyuru yayınlanmamış." };
  }

  const lines = announcements.slice(0, 5).map((a) => `  ${a.title}`);
  return { answer: `📢 Toplam ${announcements.length} duyuru var.\n${lines.join("\n")}` };
}

export async function handleWeatherCity(_profile: ProfileRow, city: string): Promise<IntentResult> {
  const displayCity = city || "Erzurum";
  const weather = await getWeather(displayCity);
  return { answer: `${displayCity} için hava durumu: ${weather}` };
}

export async function handlePrayerCity(_profile: ProfileRow, city: string): Promise<IntentResult> {
  const displayCity = city || "Erzurum";
  const times = await getPrayerTimes(displayCity, "Turkey");
  return { answer: `${displayCity} için namaz vakitleri: ${times}` };
}

export async function handleSearchWeb(_profile: ProfileRow, query: string): Promise<IntentResult> {
  const results = await webSearch(query);
  return { answer: `"${query}" için sonuçlar:\n\n${results}` };
}

export async function handleStudentQuery(profile: ProfileRow, studentName: string): Promise<IntentResult> {
  if (!studentName.trim()) {
    return { answer: "Hangi öğrenci hakkında bilgi istiyorsunuz? Lütfen bir öğrenci adı belirtin." };
  }
  const report = await getStudentFullReport(profile, studentName.trim());
  return { answer: report.summary };
}

export async function handleSummaryToday(profile: ProfileRow): Promise<IntentResult> {
  const [att, inf, stu, tasks, lib, sessions, ann] = await Promise.all([
    handleAttendanceToday(profile),
    handleInfirmaryToday(profile),
    handleStudentNewToday(profile),
    handleTasksToday(profile),
    handleLibraryOverdue(profile),
    handleLiveSessionToday(profile).catch(() => ({ answer: "" }) as IntentResult),
    handleAnnouncementsActive(profile),
  ]);

  const parts = [att.answer, inf.answer, stu.answer, tasks.answer, lib.answer, sessions.answer, ann.answer].filter(Boolean);
  return { answer: `**📊 Bugünün Özeti**\n\n${parts.join("\n\n")}` };
}

export async function handleUnknown(_question: string): Promise<IntentResult> {
  return { answer: `🤔 Sorunu anlayamadım. Şu konularda yardımcı olabilirim:\n\n• Bugün yoklama alındı mı?\n• [sınıf] sınıfında yoklama alındı mı?\n• Bugün revir kaydı var mı?\n• Bugün yeni öğrenci kaydı var mı?\n• [sınıf] ders programı nedir?\n• Bugün hangi görevler var?\n• Bugün canlı oturum var mı?\n• Gecikmiş kitap var mı?\n• Bugünün özeti nedir?\n• Aktif duyuru var mı?\n• [şehir] hava durumu?\n• [şehir] namaz vakitleri?\n• [öğrenci adı] hakkında bilgi?\n• [öğrenci adı] talebe durumu/raporu?\n• İnternette [konu] araştır?` };
}

const handlerMap: Record<IntentId, (profile: ProfileRow, params: Record<string, string>) => Promise<IntentResult>> = {
  attendance_today: handleAttendanceToday,
  attendance_class: (p, params) => handleAttendanceClass(p, params.className ?? ""),
  infirmary_today: handleInfirmaryToday,
  student_new_today: handleStudentNewToday,
  schedule_class: (p, params) => handleScheduleClass(p, params.className ?? ""),
  class_info: (_p, _params) => Promise.resolve({ answer: "" }),
  tasks_today: handleTasksToday,
  live_session_today: handleLiveSessionToday,
  library_overdue: handleLibraryOverdue,
  summary_today: handleSummaryToday,
  announcements_active: handleAnnouncementsActive,
  weather_city: (p, params) => handleWeatherCity(p, params.city ?? ""),
  prayer_city: (p, params) => handlePrayerCity(p, params.city ?? ""),
  search_web: (p, params) => handleSearchWeb(p, params.query ?? params.city ?? ""),
  student_query: (p, params) => handleStudentQuery(p, params.studentName ?? ""),
  unknown: (_p, _params) => handleUnknown(""),
};

export async function executeIntent(
  intentId: IntentId,
  profile: ProfileRow,
  params: Record<string, string>,
): Promise<IntentResult> {
  const handler = handlerMap[intentId] ?? handlerMap.unknown;
  try {
    return await handler(profile, params);
  } catch (err) {
    console.error("Assistant query error:", err);
    return { answer: "Bir hata oluştu. Lütfen tekrar deneyin." };
  }
}
