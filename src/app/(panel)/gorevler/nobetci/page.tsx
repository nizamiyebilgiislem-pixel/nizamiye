import { requireAuth } from "@/lib/auth";
import { canCreateTask } from "@/lib/tasks/permissions";
import { canCreateStudentTask } from "@/lib/student-tasks/permissions";
import { getAssignableProfiles } from "@/lib/tasks/queries";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getTodayDuties } from "@/lib/tasks/duty-queries";
import { PageHeader } from "@/components/layout/page-header";
import { NobetciForm } from "@/components/tasks/nobetci-form";

export default async function NobetciPage() {
  const { profile } = await requireAuth();

  const canAssignTeacher = canCreateTask(profile);
  const canAssignStudent = canCreateStudentTask(profile);

  if (!canAssignTeacher && !canAssignStudent) {
    return (
      <div className="space-y-6">
        <PageHeader title="Nöbetçi Yönetimi" description="Nöbetçi hoca ve öğrenci atamaları." />
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Bu işlem için yetkiniz bulunmamaktadır.
        </div>
      </div>
    );
  }

  const supabase = createSupabaseAdminClient();

  const [assignableProfiles, students, { teachers: todayTeachers, students: todayStudents }] = await Promise.all([
    canAssignTeacher ? getAssignableProfiles(profile) : Promise.resolve([]),
    canAssignStudent ? getActiveStudents(supabase) : Promise.resolve([]),
    getTodayDuties(),
  ]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nöbetçi Yönetimi"
        description="Günlük nöbetçi hoca ve öğrenci atamalarını yönetin."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {canAssignTeacher ? (
          <NobetciForm
            type="teacher"
            assignableProfiles={assignableProfiles}
            todayDate={today}
            currentDuties={todayTeachers}
          />
        ) : null}

        {canAssignStudent ? (
          <NobetciForm
            type="student"
            students={students}
            todayDate={today}
            currentDuties={todayStudents}
          />
        ) : null}
      </div>
    </div>
  );
}

async function getActiveStudents(supabase: ReturnType<typeof createSupabaseAdminClient>) {
  const { data } = await supabase
    .from("students")
    .select("id, full_name, course_class_id, course_class:course_class_id(id, name)")
    .eq("status", "active")
    .order("full_name", { ascending: true });

  return (data ?? []).map((s: { id: string; full_name: string; course_class_id: string | null; course_class: { id: string; name: string } | null }) => ({
    id: s.id,
    full_name: s.full_name,
    className: s.course_class?.name ?? "",
  }));
}
