import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { DepartmentRow, DormitoryAssignmentRow, DormitoryRow, ProfileRow, StudentRow } from "@/types/database";

export type DormitoryWithDepartment = DormitoryRow & {
  department: DepartmentRow | null;
  assignment_count?: number;
};

export type DormitoryAssignmentWithStudent = DormitoryAssignmentRow & {
  student: Pick<StudentRow, "id" | "full_name"> | null;
  dormitory: Pick<DormitoryRow, "id" | "name"> | null;
};

type StudentBrief = {
  id: string;
  full_name: string;
  course_class_id: string | null;
};

type DormitoryBrief = {
  id: string;
  name: string;
  capacity: number;
};

type ProfileBrief = {
  id: string;
  full_name: string;
};

export type DormitoryAssignmentWithRelations = DormitoryAssignmentRow & {
  student: (StudentBrief & { course_class: { id: string; name: string } | null }) | null;
  dormitory: (DormitoryBrief & { department: { id: string; name: string } | null }) | null;
  assigned_by_profile: ProfileBrief | null;
};

export async function getDormitories(profile: ProfileRow) {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("dormitories")
    .select("*, department:department_id(id, name)")
    .order("name", { ascending: true });

  if (profile.role === "bolum_muduru") {
    query = query.eq("department_id", profile.department_id ?? "");
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("Yatakhaneler alınamadı.");
  }

  return data as unknown as DormitoryWithDepartment[];
}

export async function getDormitoryById(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("dormitories")
    .select("*, department:department_id(id, name)")
    .eq("id", id)
    .single();

  if (error) {
    return null;
  }

  return data as unknown as DormitoryWithDepartment;
}

export async function getDormitoryAssignmentCount(dormitoryId: string) {
  const supabase = await createSupabaseServerClient();
  const { count, error } = await supabase
    .from("dormitory_assignments")
    .select("*", { count: "exact", head: true })
    .eq("dormitory_id", dormitoryId)
    .eq("status", "active");

  if (error) {
    return 0;
  }

  return count ?? 0;
}

export async function getActiveAssignmentsByDormitory(dormitoryId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("dormitory_assignments")
    .select("*, student:student_id(id, full_name, course_class_id, course_class:course_class_id(id, name)), dormitory:dormitory_id(id, name, capacity, department:department_id(id, name)), assigned_by_profile:assigned_by(id, full_name)")
    .eq("dormitory_id", dormitoryId)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    return [];
  }

  return data as unknown as DormitoryAssignmentWithRelations[];
}

export async function getStudentActiveAssignment(studentId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("dormitory_assignments")
    .select("*, dormitory:dormitory_id(id, name, department:department_id(id, name))")
    .eq("student_id", studentId)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    return null;
  }

  return data as unknown as DormitoryAssignmentWithRelations | null;
}

export async function getStudentAssignmentHistory(studentId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("dormitory_assignments")
    .select("*, dormitory:dormitory_id(id, name, department:department_id(id, name))")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Yerleşim geçmişi alınamadı.");
  }

  return data as unknown as DormitoryAssignmentWithRelations[];
}

export async function getDormitoryDashboardData(profile: ProfileRow) {
  const supabase = await createSupabaseServerClient();

  let dormQuery = supabase.from("dormitories").select("id, capacity");

  if (profile.role === "bolum_muduru") {
    dormQuery = dormQuery.eq("department_id", profile.department_id ?? "");
  }

  const { data: dormitories, error: dormError } = await dormQuery;

  if (dormError) {
    throw new Error("Yatakhane verisi alınamadı.");
  }

  let { count: totalAssigned } = await supabase
    .from("dormitory_assignments")
    .select("id", { count: "exact", head: true })
    .eq("status", "active");

  if (profile.role === "bolum_muduru") {
    const dormIds = dormitories.map((d) => d.id);
    const { count: filtered } = await supabase
      .from("dormitory_assignments")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")
      .in("dormitory_id", dormIds.length > 0 ? dormIds : [""]);
    totalAssigned = filtered;
  }

  const totalCapacity = dormitories.reduce((sum, d) => sum + d.capacity, 0);
  const totalDormitories = dormitories.length;
  const assignedCount = totalAssigned ?? 0;
  const availableCapacity = totalCapacity - assignedCount;

  return {
    totalDormitories,
    totalCapacity,
    assignedCount,
    availableCapacity: Math.max(0, availableCapacity),
  };
}

export async function getUnassignedStudentsCount(profile: ProfileRow) {
  const supabase = await createSupabaseServerClient();

  let studentQuery = supabase
    .from("students")
    .select("id")
    .eq("status", "active");

  if (profile.role === "bolum_muduru") {
    const { data: classes } = await supabase
      .from("classes")
      .select("id")
      .eq("department_id", profile.department_id ?? "");

    const classIds = (classes ?? []).map((c) => c.id);
    if (classIds.length === 0) {
      return 0;
    }
    studentQuery = studentQuery.in("course_class_id", classIds);
  }

  const { data: activeStudents } = await studentQuery;

  if (!activeStudents || activeStudents.length === 0) {
    return 0;
  }

  const studentIds = activeStudents.map((s) => s.id);

  const { data: assigned } = await supabase
    .from("dormitory_assignments")
    .select("student_id")
    .eq("status", "active")
    .in("student_id", studentIds);

  const assignedIds = new Set((assigned ?? []).map((a) => a.student_id));
  return studentIds.filter((id) => !assignedIds.has(id)).length;
}
