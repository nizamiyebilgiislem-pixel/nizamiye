import type { ProfileRow } from "@/types/database";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { executeIntent } from "./queries";
import { getWeather } from "./weather";
import { getPrayerTimes } from "./prayer-times";
import { getExchangeRates } from "./exchange-rates";
import { getTodayInfo } from "./today-info";
import { getDailyQuote } from "./daily-quote";

const roleDescriptions: Record<string, string> = {
  admin: "Tüm modüllere tam erişim. Her şeyi görebilir ve sorgulayabilirsin.",
  genel_mudur: "Tüm modüllere tam erişim. Her şeyi görebilir ve sorgulayabilirsin.",
  bolum_muduru: "Kendi departmanındaki verilere erişim.",
  hoca: "Kendi sınıfı ve dersleriyle ilgili verilere erişim.",
};

export function buildSystemPrompt(profile: ProfileRow): string {
  return `Sen POLA AI'sın, Nizamiye Eğitim Kurumları OYBS yapay zeka asistanısın.

KULLANICI:
- Ad: ${profile.full_name}
- Rol: ${profile.role}
- Yetki: ${roleDescriptions[profile.role] ?? "Sınırlı erişim."}

KİŞİLİK:
- Sen Emin Nusret Polat tarafından geliştirilmiş bir yapay zeka asistanısın.
- Emin Bey, Nizamiye Eğitim Kurumları'nda bilgi işlem görevlisi, OYBS sistem geliştiricisi ve senin yaratıcındır.
- Amacın kullanıcılara asistanlık yapmak, iş yükünü hafifletmek, sistem verilerine hızlı erişim sağlamak.
- Profesyonel, kibar ve resmi bir dil kullan. Kurum içi iletişimde saygılı ol.
- Arada emoji kullanabilirsin ama abartma.

ÖZEL SORULAR:
- "Kimsin?", "Sen kimsin?" tarzı sorulara -> "Ben POLA AI, Nizamiye Eğitim Kurumları OYBS yapay zeka asistanıyım. Emin Nusret Polat tarafından geliştirildim. Amacım size Nizamiye OYBS'de asistanlık yapmak, iş yükünüzü hafifletmek 😊"
- "Emin kim?", "Emin Bey kimdir?" tarzı sorulara -> "Emin Bey Nizamiye Eğitim Kurumları bilgi işlem görevlisi, OYBS sistem geliştiricisi ve POLA AI'ın yaratıcısıdır. Kendisiyle iletişime geçmek için kurum içi bilgi işlem birimine ulaşabilirsiniz 👨‍💻"
- Yetki hatası gerektiren durumlarda -> "Bu işlem için yetkiniz bulunmamaktadır. Yetki işlemleri için Emin Nusret Polat ile iletişime geçebilirsiniz."

KURALLAR:
1. Sadece "BUGÜNÜN VERİLERİ" içindekilere göre cevap ver. Asla uydurma.
2. Yetkin olmayan bir konu sorulursa "Bu işlem için yetkiniz bulunmamaktadır. Yetki işlemleri için Emin Nusret Polat ile iletişime geçebilirsiniz." de.
3. Kısa ve net cevap ver. Madde madde sıralama yap.
4. Türkçe cevap ver, profesyonel ve kibar ol.
5. Bir sınıf adı geçiyorsa "=== SINIFLAR ===" bölümünde ara, bulamazsan en yakın sınıf isimlerini öner.
6. Tarih veya saat sorulursa bugünün verilerini kullan.
7. Hava durumu ve namaz vakitleri için sistemim her şehri destekler. Örneğin "İstanbul hava durumu" diye sorarsanız sorgularım. Eğer şehir belirtilmezse Erzurum verilerini kullanırım.
8. İnternette araştırma yapabilirim. "Araştır", "kimdir", "nedir", "ne demek" gibi sorularda web'den bilgi getirebilirim.
9. Öğrenci sorgulamalarında kapsamlı bilgi veririm. "Ahmet hakkında bilgi ver", "Mehmet talebe durumu" gibi sorularda öğrencinin notlarını, revir kayıtlarını, yatakhane bilgisini, devamsızlığını, kütüphane kayıtlarını, hoca notlarını ve okuduğu kitapları getiririm. Verilere dayanarak öğrenci hakkında analiz ve yorum da yapabilirim. Eğer hocanın eklediği notlar varsa onları öncelikli olarak aktarırım, yoksa kendi gözlemlerimi eklerim.

VERITABANI TABLOLARI (referans):
- classes: id, name, class_teacher_id (siniflar)
- students: id, full_name, course_class_id (ogrenciler)
- departments: id, name (bolumler)
- courses: id, name (dersler)
- profiles: id, full_name, role (kullanicilar)
- attendance_sessions: id, class_id, attendance_date (yoklama)
- infirmary_records: id, student_id, record_date (revir)
- weekly_schedule_slots: id, class_id, class_course_id, day_of_week, period_no (ders programi)
- class_courses: id, class_id, course_id, teacher_id
- tasks: id, title, status, due_date (gorevler)
- live_sessions: id, title, start_time, status (canli oturum)
- library_loans: id, book_id, student_id, due_date, status (kitap odunc)`;
}

async function getClassesData(): Promise<string> {
  const supabase = createSupabaseAdminClient();
  const { data: classes } = await supabase
    .from("classes")
    .select("id, name, class_teacher_id");

  if (!classes || classes.length === 0) return "Sınıf bulunamadı.";

  const teacherIds = classes.map((c) => c.class_teacher_id).filter(Boolean) as string[];
  const teachers = teacherIds.length > 0
    ? (await supabase.from("profiles").select("id, full_name").in("id", teacherIds)).data ?? []
    : [];

  const teacherMap = new Map(teachers.map((t) => [t.id, t.full_name]));

  const classIds = classes.map((c) => c.id);
  const { data: students } = await supabase
    .from("students")
    .select("course_class_id")
    .in("course_class_id", classIds);

  const countMap = new Map<string, number>();
  for (const s of students ?? []) {
    if (s.course_class_id) {
      countMap.set(s.course_class_id, (countMap.get(s.course_class_id) ?? 0) + 1);
    }
  }

  return classes
    .map((c) => {
      const teacherName = c.class_teacher_id ? (teacherMap.get(c.class_teacher_id) ?? "Atanmamış") : "Atanmamış";
      return `- ${c.name}: ${countMap.get(c.id) ?? 0} öğrenci, öğretmen: ${teacherName}`;
    })
    .join("\n");
}

async function getDepartmentsData(): Promise<string> {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase.from("departments").select("name").order("name");
  return (data ?? []).map((d) => `- ${d.name}`).join("\n");
}

async function getRecentStudents(): Promise<string> {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("students")
    .select("full_name, course_class_id")
    .order("created_at", { ascending: false })
    .limit(5);

  if (!data || data.length === 0) return "Son kayıt yok.";

  const classIds = [...new Set(data.map((s) => s.course_class_id).filter(Boolean) as string[])];
  const { data: classes } = await supabase
    .from("classes")
    .select("id, name")
    .in("id", classIds);

  const classNameMap = new Map(classes?.map((c) => [c.id, c.name]) ?? []);
  return data
    .map((s) => `- ${s.full_name} (${s.course_class_id ? (classNameMap.get(s.course_class_id) ?? "Sınıfsız") : "Sınıfsız"})`)
    .join("\n");
}

async function getTodayScheduleSummary(): Promise<string> {
  const supabase = createSupabaseAdminClient();

  const { data: classCourses } = await supabase.from("class_courses").select("id, course_id, class_id");
  if (!classCourses || classCourses.length === 0) return "Ders programı verisi yok.";

  const courseIds = [...new Set(classCourses.map((cc) => cc.course_id))];
  const { data: courses } = await supabase.from("courses").select("id, name").in("id", courseIds);
  const courseNameMap = new Map(courses?.map((c) => [c.id, c.name]) ?? []);

  const classIds = [...new Set(classCourses.map((cc) => cc.class_id))];
  const { data: classes } = await supabase.from("classes").select("id, name").in("id", classIds);
  const classNameMap = new Map(classes?.map((c) => [c.id, c.name]) ?? []);

  const ccMap = new Map(classCourses.map((cc) => [cc.id, cc]));

  const dayNames = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

  const { data: slots } = await supabase
    .from("weekly_schedule_slots")
    .select("*")
    .order("day_of_week")
    .order("period_no");

  if (!slots || slots.length === 0) return "Ders programı slotu yok.";

  const grouped = new Map<string, string[]>();
  for (const slot of slots) {
    const cc = ccMap.get(slot.class_course_id);
    if (!cc) continue;
    const clsName = classNameMap.get(cc.class_id) ?? "?";
    const courseName = courseNameMap.get(cc.course_id) ?? "?";
    const dayName = dayNames[slot.day_of_week - 1] ?? `Gün ${slot.day_of_week}`;
    const key = `${dayName} - ${clsName}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(`${slot.period_no}. ders: ${courseName}`);
  }

  const lines: string[] = [];
  for (const [key, lessons] of grouped) {
    lines.push(`${key}\n  ${lessons.join("\n  ")}`);
  }

  return lines.slice(0, 30).join("\n") + (lines.length > 30 ? "\n..." : "");
}

async function getTodayBirthdays(): Promise<string> {
  const supabase = createSupabaseAdminClient();
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  const { data: students } = await supabase
    .from("students")
    .select("full_name, course_class_id")
    .filter("birth_date", "like", `%-${month}-${day}`);

  const { data: profiles } = await supabase
    .from("profiles")
    .select("full_name")
    .filter("birth_date", "like", `%-${month}-${day}`);

  const parts: string[] = [];
  if (students && students.length > 0) {
    const classIds = [...new Set(students.map((s) => s.course_class_id).filter(Boolean) as string[])];
    const { data: classes } = await supabase.from("classes").select("id, name").in("id", classIds);
    const classNameMap = new Map(classes?.map((c) => [c.id, c.name]) ?? []);
    parts.push("Öğrenciler:");
    for (const s of students) {
      parts.push(`  - ${s.full_name} (${s.course_class_id ? (classNameMap.get(s.course_class_id) ?? "?") : "?"})`);
    }
  }
  if (profiles && profiles.length > 0) {
    parts.push("Personel:");
    for (const p of profiles) parts.push(`  - ${p.full_name}`);
  }
  if (parts.length === 0) return "Bugün doğum günü olan yok.";
  return `🎂 Bugün doğum günü olanlar:\n${parts.join("\n")}`;
}

export async function buildContextualData(profile: ProfileRow): Promise<string> {
  const perfStart = Date.now();

  const [att, inf, stu, tasks, lib, sessions, ann, classes, deps, recent, schedule, weather, prayer, rates, todayInfo, birthdays] = await Promise.all([
    executeIntent("attendance_today", profile, {}),
    executeIntent("infirmary_today", profile, {}),
    executeIntent("student_new_today", profile, {}),
    executeIntent("tasks_today", profile, {}),
    executeIntent("library_overdue", profile, {}),
    executeIntent("live_session_today", profile, {}).catch(() => ({ answer: "" })),
    executeIntent("announcements_active", profile, {}),
    getClassesData(),
    getDepartmentsData(),
    getRecentStudents(),
    getTodayScheduleSummary(),
    getWeather(),
    getPrayerTimes(),
    getExchangeRates(),
    getTodayInfo(),
    getTodayBirthdays(),
  ]);

  const quote = getDailyQuote();

  const parts = [
    "=== GÜNLÜK DURUM ===",
    att.answer,
    inf.answer,
    stu.answer,
    tasks.answer,
    lib.answer,
    sessions.answer,
    ann.answer,
    "",
    "=== SINIFLAR ===",
    classes,
    "",
    "=== DEPARTMANLAR ===",
    deps,
    "",
    "=== SON KAYIT OLAN ÖĞRENCİLER ===",
    recent,
    "",
    "=== DERS PROGRAMI (haftalık) ===",
    schedule,
    "",
    "=== HAVA DURUMU ===",
    `Erzurum: ${weather}`,
    "",
    "=== NAMAZ VAKİTLERİ ===",
    prayer,
    "",
    "=== DÖVİZ KURU ===",
    rates,
    "",
    "=== BUGÜN ===",
    todayInfo,
    "",
    "=== GÜNÜN SÖZÜ ===",
    quote,
    "",
    "=== DOĞUM GÜNÜ ===",
    birthdays,
  ];

  const elapsed = Date.now() - perfStart;
  console.log(`[assistant:context] collected in ${elapsed}ms`);

  return parts.join("\n");
}
