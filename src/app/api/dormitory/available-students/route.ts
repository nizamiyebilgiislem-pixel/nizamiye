import { NextResponse } from "next/server";

import { getCurrentProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type StudentBrief = {
  id: string;
  full_name: string;
};

export async function GET() {
  const profile = await getCurrentProfile();

  if (!profile) {
    return NextResponse.json({ students: [] });
  }

  const supabase = await createSupabaseServerClient();

  let activeStudents: StudentBrief[] = [];

  if (profile.role === "bolum_muduru" && profile.department_id) {
    const { data: classes } = await supabase
      .from("classes")
      .select("id")
      .eq("department_id", profile.department_id);

    const classIds = (classes ?? []).map((c) => c.id);

    if (classIds.length === 0) {
      return NextResponse.json({ students: [] });
    }

    const { data } = await supabase
      .from("students")
      .select("id, full_name")
      .eq("status", "active")
      .in("course_class_id", classIds)
      .order("full_name", { ascending: true });

    activeStudents = data ?? [];
  } else {
    const { data } = await supabase
      .from("students")
      .select("id, full_name")
      .eq("status", "active")
      .order("full_name", { ascending: true });

    activeStudents = data ?? [];
  }

  if (activeStudents.length === 0) {
    return NextResponse.json({ students: [] });
  }

  const studentIds = activeStudents.map((s) => s.id);

  const { data: assignments } = await supabase
    .from("dormitory_assignments")
    .select("student_id")
    .eq("status", "active")
    .in("student_id", studentIds);

  const assignedIds = new Set((assignments ?? []).map((a) => a.student_id));
  const available = activeStudents.filter((s) => !assignedIds.has(s.id));

  return NextResponse.json({ students: available });
}
