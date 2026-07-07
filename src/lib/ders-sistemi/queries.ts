import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient, SupabaseAdminConfigError } from "@/lib/supabase/admin";
import type { ClassRow, CourseRow, DepartmentRow, ProfileRow } from "@/types/database";

export type DersSistemiCourse = CourseRow & {
  department: DepartmentRow | null;
  assignments: Array<{
    id: string;
    class_id: string;
    class_name: string;
    teacher: ProfileRow | null;
    is_active: boolean;
  }>;
};

export async function getDersSistemiCourses(profile: ProfileRow) {
  const supabase = await createSupabaseServerClient();

  let deptQuery = supabase.from("departments").select("*").order("name", { ascending: true });
  if (profile.role === "bolum_muduru") {
    deptQuery = deptQuery.eq("id", profile.department_id ?? "");
  }
  const { data: departments } = await deptQuery;
  const departmentIds = (departments ?? []).map((d) => d.id);

  if (departmentIds.length === 0) {
    return [];
  }

  const [{ data: courses }, { data: classCourses }, { data: classes }, { data: teachers }] = await Promise.all([
    supabase.from("courses").select("*").in("department_id", departmentIds).order("name", { ascending: true }),
    supabase.from("class_courses").select("*"),
    supabase.from("classes").select("*").in("department_id", departmentIds),
    supabase.from("profiles").select("*").eq("is_active", true),
  ]);

  const departmentMap = new Map((departments ?? []).map((d) => [d.id, d]));
  const classMap = new Map((classes ?? []).map((c) => [c.id, c]));
  const teacherMap = new Map((teachers ?? []).map((t) => [t.id, t]));

  return (courses ?? []).map((course) => {
    const courseClassCourses = (classCourses ?? []).filter((cc) => cc.course_id === course.id);
    return {
      ...course,
      department: departmentMap.get(course.department_id) ?? null,
      assignments: courseClassCourses.map((cc) => ({
        id: cc.id,
        class_id: cc.class_id,
        class_name: classMap.get(cc.class_id)?.name ?? "-",
        teacher: cc.teacher_id ? (teacherMap.get(cc.teacher_id) ?? null) : null,
        is_active: cc.is_active,
      })),
    } satisfies DersSistemiCourse;
  });
}

export async function getDersSistemiCreateData(profile: ProfileRow) {
  const supabase = await createSupabaseServerClient();

  let deptQuery = supabase.from("departments").select("*").order("name", { ascending: true });
  if (profile.role === "bolum_muduru") {
    deptQuery = deptQuery.eq("id", profile.department_id ?? "");
  }
  const { data: departments } = await deptQuery;
  const departmentIds = (departments ?? []).map((d) => d.id);

  const [{ data: classes }, teachersResult] = await Promise.all([
    departmentIds.length > 0
      ? supabase.from("classes").select("*").in("department_id", departmentIds).eq("is_active", true).order("name", { ascending: true })
      : Promise.resolve({ data: [] }),
    getAllCourseTeachers(),
  ]);

  return {
    departments: departments ?? [],
    classes: classes ?? [],
    teachers: teachersResult.data ?? [],
  };
}

async function getAllCourseTeachers(): Promise<{ data: ProfileRow[]; error: { code?: string | null; message?: string | null } | null }> {
  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("profiles")
      .select("*")
      .eq("role", "hoca")
      .eq("is_active", true)
      .order("full_name", { ascending: true });

    return { data: data ?? [], error };
  } catch (error) {
    if (!(error instanceof SupabaseAdminConfigError)) {
      throw error;
    }

    const supabase = await createSupabaseServerClient();
    const { data, error: serverError } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "hoca")
      .eq("is_active", true)
      .order("full_name", { ascending: true });

    return { data: data ?? [], error: serverError };
  }
}

export type DersSistemiEditData = {
  course: DersSistemiCourse;
  departments: DepartmentRow[];
  classes: ClassRow[];
  teachers: ProfileRow[];
  assignedClassIds: string[];
};

export async function getDersSistemiEditData(profile: ProfileRow, courseId: string): Promise<DersSistemiEditData | null> {
  const courses = await getDersSistemiCourses(profile);
  const course = courses.find((c) => c.id === courseId);
  if (!course) return null;

  const createData = await getDersSistemiCreateData(profile);

  return {
    course,
    departments: createData.departments,
    classes: createData.classes,
    teachers: createData.teachers,
    assignedClassIds: course.assignments.filter((a) => a.is_active).map((a) => a.class_id),
  };
}
