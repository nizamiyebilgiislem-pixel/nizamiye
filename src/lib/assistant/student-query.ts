import type { ProfileRow } from "@/types/database";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type StudentProfileReport = {
  found: boolean;
  summary: string;
};

export async function getStudentFullReport(
  profile: ProfileRow,
  studentName: string,
): Promise<StudentProfileReport> {
  const supabase = createSupabaseAdminClient();

  const { data: students } = await supabase
    .from("students")
    .select("*")
    .ilike("full_name", `%${studentName}%`)
    .limit(5);

  if (!students || students.length === 0) {
    const { data: allStudents } = await supabase
      .from("students")
      .select("full_name, course_class_id")
      .limit(20);

    const names = (allStudents ?? []).map((s) => s.full_name).slice(0, 10);
    return {
      found: false,
      summary: `"${studentName}" adında bir öğrenci bulamadım. Kayıtlı öğrencilerden bazıları:\n${names.map((n) => `  • ${n}`).join("\n")}`,
    };
  }

  const student = students[0];
  const lines: string[] = [
    `=== ${student.full_name} - KAPSAMLI TALEBE RAPORU ===`,
    `Öğrenci No: ${student.identity_number ?? "Belirtilmemiş"}`,
    `Baba Adı: ${student.father_name ?? "Belirtilmemiş"}`,
    `Anne Adı: ${student.mother_name ?? "Belirtilmemiş"}`,
    `Doğum Tarihi: ${student.birth_date ?? "Belirtilmemiş"}`,
    `Kayıt Tarihi: ${student.registration_date ?? "Belirtilmemiş"}`,
    `Veli Telefon: ${student.guardian_phone ?? "Belirtilmemiş"}`,
    `Kan Grubu: ${student.blood_type ?? "Belirtilmemiş"}`,
    `Memleket: ${student.hometown ?? "Belirtilmemiş"}`,
    `Adres: ${student.address ?? "Belirtilmemiş"}`,
    `Durum: ${student.status === "active" ? "Aktif" : student.status === "graduated" ? "Mezun" : "Ayrıldı"}`,
  ];

  if (student.course_class_id) {
    const { data: cls } = await supabase
      .from("classes")
      .select("id, name, department_id")
      .eq("id", student.course_class_id)
      .maybeSingle();

    if (cls) {
      const { data: dept } = await supabase
        .from("departments")
        .select("name")
        .eq("id", cls.department_id)
        .maybeSingle();

      lines.push(`Sınıfı: ${cls.name} (${dept?.name ?? "Belirtilmemiş"})`);
    }
  }

  lines.push("");

  const [
    grades,
    evaluations,
    infirmaryRecords,
    dormitory,
    attendanceSummary,
    loans,
    profileNotes,
    books,
  ] = await Promise.all([
    getStudentGrades(supabase, student.id),
    getStudentEvaluations(supabase, student.id),
    getInfirmaryRecords(supabase, student.id),
    getDormitoryInfo(supabase, student.id),
    getAttendanceSummary(supabase, student.id),
    getLibraryLoans(supabase, student.id),
    getProfileNotes(supabase, student.id),
    getStudentBooks(supabase, student.id),
  ]);

  lines.push("--- NOTLAR / SINAV SONUÇLARI ---");
  if (grades.length > 0) {
    lines.push(...grades);
  } else {
    lines.push("Henüz not girilmemiş.");
  }
  lines.push("");

  lines.push("--- KANAAT / DEĞERLENDİRME ---");
  if (evaluations.length > 0) {
    lines.push(...evaluations);
  } else {
    lines.push("Henüz kanaat/değerlendirme girilmemiş.");
  }
  lines.push("");

  lines.push("--- REVİR KAYITLARI ---");
  if (infirmaryRecords.length > 0) {
    lines.push(...infirmaryRecords);
  } else {
    lines.push("Hiç revir kaydı yok.");
  }
  lines.push("");

  lines.push("--- YATAKHANE ---");
  if (dormitory) {
    lines.push(dormitory);
  } else {
    lines.push("Yatakhane kaydı bulunmuyor.");
  }
  lines.push("");

  lines.push("--- DEVAMSIZLIK ---");
  if (attendanceSummary.length > 0) {
    lines.push(...attendanceSummary);
  } else {
    lines.push("Devamsızlık kaydı bulunmuyor.");
  }
  lines.push("");

  lines.push("--- KÜTÜPHANE / KİTAP ---");
  if (loans.length > 0) {
    lines.push(...loans);
  } else {
    lines.push("Kütüphane kaydı bulunmuyor.");
  }
  lines.push("");

  lines.push("--- HOCA NOTLARI ---");
  if (profileNotes.length > 0) {
    lines.push(...profileNotes);
  } else {
    lines.push("Hoca notu bulunmuyor.");
  }
  lines.push("");

  lines.push("--- OKUDUĞU KİTAPLAR ---");
  if (books.length > 0) {
    lines.push(...books);
  } else {
    lines.push("Kitap kaydı bulunmuyor.");
  }

  return {
    found: true,
    summary: lines.join("\n"),
  };
}

async function getStudentGrades(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  studentId: string,
): Promise<string[]> {
  const { data: grades } = await supabase
    .from("grades")
    .select("id, grade, course_id, exam_type_id")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })
    .limit(30);

  if (!grades || grades.length === 0) return [];

  const courseIds = [...new Set(grades.map((g) => g.course_id))];
  const examTypeIds = [...new Set(grades.map((g) => g.exam_type_id))];

  const [coursesRes, examTypesRes] = await Promise.all([
    supabase.from("courses").select("id, name").in("id", courseIds),
    supabase.from("exam_types").select("id, name").in("id", examTypeIds),
  ]);

  const courseMap = new Map((coursesRes.data ?? []).map((c) => [c.id, c.name]));
  const examTypeMap = new Map((examTypesRes.data ?? []).map((e) => [e.id, e.name]));

  const courseGroups = new Map<string, { courseName: string; grades: { examType: string; grade: number }[] }>();
  for (const g of grades) {
    const courseName = courseMap.get(g.course_id) ?? "Bilinmeyen Ders";
    const examType = examTypeMap.get(g.exam_type_id) ?? "Sınav";
    if (!courseGroups.has(courseName)) {
      courseGroups.set(courseName, { courseName, grades: [] });
    }
    courseGroups.get(courseName)!.grades.push({ examType, grade: g.grade });
  }

  const lines: string[] = [];
  for (const [, group] of courseGroups) {
    const gradeStr = group.grades.map((g) => `${g.examType}: ${g.grade}`).join(", ");
    lines.push(`  📘 ${group.courseName}: ${gradeStr}`);
  }
  return lines;
}

async function getStudentEvaluations(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  studentId: string,
): Promise<string[]> {
  const { data: evals } = await supabase
    .from("student_evaluations")
    .select("id, behavior_score, attendance_score, lesson_performance_score, discipline_score, memorization_score, general_opinion, term_id")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (!evals || evals.length === 0) return [];

  const termIds = [...new Set(evals.map((e) => e.term_id))];
  const { data: terms } = await supabase.from("academic_terms").select("id, name").in("id", termIds);
  const termMap = new Map((terms ?? []).map((t) => [t.id, t.name]));

  const lines: string[] = [];
  for (const e of evals) {
    const termName = termMap.get(e.term_id) ?? "Dönem";
    const scores: string[] = [];
    if (e.behavior_score != null) scores.push(`Davranış: ${e.behavior_score}`);
    if (e.attendance_score != null) scores.push(`Devam: ${e.attendance_score}`);
    if (e.lesson_performance_score != null) scores.push(`Ders: ${e.lesson_performance_score}`);
    if (e.discipline_score != null) scores.push(`Disiplin: ${e.discipline_score}`);
    if (e.memorization_score != null) scores.push(`Ezber: ${e.memorization_score}`);
    lines.push(`  📋 ${termName}: ${scores.join(" | ")}`);
    if (e.general_opinion) {
      lines.push(`    💬 Görüş: ${e.general_opinion}`);
    }
  }
  return lines;
}

async function getInfirmaryRecords(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  studentId: string,
): Promise<string[]> {
  const { data: records } = await supabase
    .from("infirmary_records")
    .select("*")
    .eq("student_id", studentId)
    .order("record_date", { ascending: false })
    .limit(10);

  if (!records || records.length === 0) return [];

  const totalCount = records.length;
  const hospitalVisits = records.filter((r) => r.sent_to_hospital).length;
  const lastRecord = records[0];

  const lines: string[] = [
    `  Toplam ${totalCount} revir kaydı, ${hospitalVisits} hastane sevki`,
    `  Son kayıt (${lastRecord.record_date}): ${lastRecord.complaint ?? "Belirtilmemiş şikayet"}` +
      (lastRecord.treatment ? ` → Tedavi: ${lastRecord.treatment}` : ""),
  ];
  return lines;
}

async function getDormitoryInfo(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  studentId: string,
): Promise<string | null> {
  const { data: assignment } = await supabase
    .from("dormitory_assignments")
    .select("*, dormitory:dormitory_id(name)")
    .eq("student_id", studentId)
    .eq("status", "active")
    .maybeSingle();

  if (!assignment) return null;

  const dormName = (assignment.dormitory as { name: string } | null)?.name ?? "Bilinmeyen Yatakhane";
  return `  🏠 ${dormName} (${assignment.start_date ? new Date(assignment.start_date).toLocaleDateString("tr-TR") : "?"} - ${assignment.end_date ? new Date(assignment.end_date).toLocaleDateString("tr-TR") : "Devam ediyor"})`;
}

async function getAttendanceSummary(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  studentId: string,
): Promise<string[]> {
  const { data: records } = await supabase
    .from("attendance_records")
    .select("*, session:session_id(attendance_date, attendance_type)")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (!records || records.length === 0) return [];

  const total = records.length;
  const absents = records.filter((r) => r.status === "absent").length;
  const excused = records.filter((r) => r.status === "excused").length;
  const lates = records.filter((r) => r.status === "late").length;

  const lines: string[] = [
    `  Toplam ${total} yoklama kaydı`,
    `  Devamsız: ${absents}, Özürlü: ${excused}, Geç: ${lates}`,
  ];

  const lastRecord = records[0];
  const sessionDate = (lastRecord.session as { attendance_date?: string } | null)?.attendance_date ?? "?";
  lines.push(`  Son durum: ${lastRecord.status === "present" ? "Mevcut" : lastRecord.status === "absent" ? "Devamsız" : lastRecord.status === "excused" ? "Özürlü" : "Geç"} (${sessionDate})`);

  return lines;
}

async function getLibraryLoans(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  studentId: string,
): Promise<string[]> {
  const { data: loans } = await supabase
    .from("library_loans")
    .select("*, book:book_id(title)")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (!loans || loans.length === 0) return [];

  const activeLoans = loans.filter((l) => l.status === "active" || l.status === "borrowed");
  const overdueLoans = loans.filter((l) => l.status === "overdue");
  const returnedLoans = loans.filter((l) => l.status === "returned");

  const lines: string[] = [];
  if (activeLoans.length > 0) {
    lines.push(`  📚 Aktif ödünç: ${activeLoans.length} kitap`);
    for (const l of activeLoans.slice(0, 3)) {
      const title = (l.book as { title: string } | null)?.title ?? "Bilinmeyen";
      lines.push(`    • ${title}`);
    }
  }
  if (overdueLoans.length > 0) {
    lines.push(`  ⚠️ Gecikmiş: ${overdueLoans.length} kitap`);
  }
  if (returnedLoans.length > 0) {
    lines.push(`  ✅ Toplam iade: ${returnedLoans.length} kitap`);
  }
  if (lines.length === 0) {
    lines.push("  Ödünç kitap kaydı bulunmuyor.");
  }
  return lines;
}

async function getProfileNotes(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  studentId: string,
): Promise<string[]> {
  const { data: notes } = await supabase
    .from("student_profile_notes")
    .select("*, created_by_profile:created_by(full_name)")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (!notes || notes.length === 0) return [];

  const lines: string[] = [];
  for (const n of notes) {
    const authorName = (n.created_by_profile as { full_name: string } | null)?.full_name ?? "Bilinmeyen";
    lines.push(`  📝 ${authorName}: ${n.note}`);
  }
  return lines;
}

async function getStudentBooks(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  studentId: string,
): Promise<string[]> {
  const { data: books } = await supabase
    .from("student_books")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (!books || books.length === 0) return [];

  return books.map((b) =>
    `  📖 ${b.title}${b.author ? ` - ${b.author}` : ""}${b.read_date ? ` (Okudu: ${b.read_date})` : ""}${b.note ? ` - ${b.note}` : ""}`,
  );
}
