import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { archivedStudentStatuses } from "@/lib/students/constants";
import type { ClassRow, DepartmentRow, ProfileRow, StudentRow } from "@/types/database";

export type StudentWithRelations = StudentRow & {
  course_class: ClassRow | null;
  department: DepartmentRow | null;
};

export type StudentListFilters = {
  search?: string;
  departmentId?: string;
  classId?: string;
  archived?: boolean;
};

export const getDepartments = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("departments")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    throw new Error("Bölümler alınamadı.");
  }

  return data;
});

export const getClassesForProfile = cache(async (profile: ProfileRow) => {
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("classes").select("*").eq("is_active", true).order("name", { ascending: true });

  if (profile.role === "bolum_muduru" || profile.role === "hoca") {
    query = query.eq("department_id", profile.department_id ?? "");
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("Sınıflar alınamadı.");
  }

  return data;
});

export async function getStudentsForProfile(
  profile: ProfileRow,
  filters: StudentListFilters = {},
  page?: number,
  pageSize = 20,
) {
  const supabase = await createSupabaseServerClient();
  const classes = await getClassesForProfile(profile);
  const departments = await getDepartments();
  const classMap = new Map(classes.map((courseClass) => [courseClass.id, courseClass]));
  const departmentMap = new Map(departments.map((department) => [department.id, department]));

  let query = supabase.from("students").select("*", { count: "exact" }).order("full_name", { ascending: true });

  if (filters.archived) {
    query = query.in("status", archivedStudentStatuses);
  } else {
    query = query.eq("status", "active");
  }

  if (filters.search) {
    const term = `%${filters.search.trim()}%`;
    query = query.or(`full_name.ilike.${term},identity_number.ilike.${term},guardian_phone.ilike.${term}`);
  }

  if (filters.classId) {
    query = query.eq("course_class_id", filters.classId);
  }

  const allowedClassIds = getAllowedClassIds(profile, classes, filters.departmentId);

  if (allowedClassIds.length === 0) {
    return { students: [], classes, departments, totalCount: 0 };
  }

  query = query.in("course_class_id", allowedClassIds);

  if (page !== undefined) {
    const from = (page - 1) * pageSize;
    query = query.range(from, from + pageSize - 1);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error("Talebeler alınamadı.");
  }

  return {
    students: (data ?? []).map((student) => attachRelations(student, classMap, departmentMap)),
    classes,
    departments,
    totalCount: count ?? 0,
  };
}

export async function getStudentById(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data: student, error } = await supabase.from("students").select("*").eq("id", id).maybeSingle();

  if (error) {
    throw new Error("Talebe bilgisi alınamadı.");
  }

  if (!student) {
    return null;
  }

  const courseClass = student.course_class_id ? await getClassById(student.course_class_id) : null;
  const department = courseClass ? await getDepartmentById(courseClass.department_id) : null;

  return {
    ...student,
    course_class: courseClass,
    department,
  };
}

async function getClassById(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("classes").select("*").eq("id", id).maybeSingle();

  if (error) {
    throw new Error("Sınıf bilgisi alınamadı.");
  }

  return data;
}

async function getDepartmentById(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("departments").select("*").eq("id", id).maybeSingle();

  if (error) {
    throw new Error("Bölüm bilgisi alınamadı.");
  }

  return data;
}

function getAllowedClassIds(profile: ProfileRow, classes: ClassRow[], departmentId?: string) {
  return classes
    .filter((courseClass) => {
      if (departmentId && courseClass.department_id !== departmentId) {
        return false;
      }

      if (profile.role === "admin" || profile.role === "genel_mudur") {
        return true;
      }

      return profile.department_id === courseClass.department_id;
    })
    .map((courseClass) => courseClass.id);
}

function attachRelations(
  student: StudentRow,
  classMap: Map<string, ClassRow>,
  departmentMap: Map<string, DepartmentRow>,
): StudentWithRelations {
  const courseClass = student.course_class_id ? classMap.get(student.course_class_id) ?? null : null;

  return {
    ...student,
    course_class: courseClass,
    department: courseClass ? departmentMap.get(courseClass.department_id) ?? null : null,
  };
}
