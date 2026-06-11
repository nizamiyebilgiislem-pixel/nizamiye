import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getClassesForProfile, getStudentsForProfile } from "@/lib/students/queries";
import { getDepartmentAnalyticsForProfile } from "@/lib/departments/analytics";
import { getTasks } from "@/lib/tasks/queries";
import type {
  ClassRow,
  DepartmentRow,
  DormitoryAssignmentRow,
  DormitoryRow,
  ProfileRow,
  StudentDocumentRow,
  StudentRow,
  TalepRow,
  TaskRow,
} from "@/types/database";

export type ReportStudentRow = StudentRow & {
  course_class: ClassRow | null;
  department: DepartmentRow | null;
  relation: string | null;
};

export type ReportParentRow = ProfileRow & {
  relation: string | null;
};

export async function getReportStudentsForProfile(profile: ProfileRow) {
  if (profile.role === "veli") {
    return getLinkedStudentsForParent(profile);
  }

  const { students } = await getStudentsForProfile(profile);
  const classes = await getClassesForProfile(profile);
  const departments = await getVisibleDepartmentsForProfile(profile);
  const classMap = new Map(classes.map((classRow) => [classRow.id, classRow]));
  const departmentMap = new Map(departments.map((department) => [department.id, department]));

  return students.map((student) => {
    const courseClass = student.course_class_id ? classMap.get(student.course_class_id) ?? null : null;
    return {
      ...student,
      course_class: courseClass,
      department: courseClass ? departmentMap.get(courseClass.department_id) ?? null : null,
      relation: null,
    } satisfies ReportStudentRow;
  });
}

export async function getVisibleDepartmentsForProfile(profile: ProfileRow) {
  const departments = await getDepartmentAnalyticsForProfile(profile);
  return departments.map((department) => ({
    id: department.id,
    name: department.name,
    slug: department.slug,
    description: department.description,
    is_active: department.is_active,
    created_at: department.created_at,
    updated_at: department.updated_at,
  })) as DepartmentRow[];
}

export async function getLinkedStudentsForParent(profile: ProfileRow) {
  const supabase = await createSupabaseServerClient();
  const [linksResult, studentsResult, classesResult, departmentsResult] = await Promise.all([
    supabase.from("parent_student_links").select("*").eq("parent_profile_id", profile.id),
    supabase.from("students").select("*"),
    supabase.from("classes").select("*"),
    supabase.from("departments").select("*"),
  ]);

  if (linksResult.error || studentsResult.error || classesResult.error || departmentsResult.error) {
    throw new Error("Rapor için talebe bağlantıları alınamadı.");
  }

  const linkedStudentIds = new Set((linksResult.data ?? []).map((link) => link.student_id));
  const students = (studentsResult.data ?? []).filter((student) => linkedStudentIds.has(student.id));
  const linksMap = new Map((linksResult.data ?? []).map((link) => [link.student_id, link.relation ?? null]));
  const classMap = new Map((classesResult.data ?? []).map((classRow) => [classRow.id, classRow]));
  const departmentMap = new Map((departmentsResult.data ?? []).map((department) => [department.id, department]));

  return students.map((student) => {
    const courseClass = student.course_class_id ? classMap.get(student.course_class_id) ?? null : null;

    return {
      ...student,
      course_class: courseClass,
      department: courseClass ? departmentMap.get(courseClass.department_id) ?? null : null,
      relation: linksMap.get(student.id) ?? null,
    } satisfies ReportStudentRow;
  });
}

export async function getStudentReportParents(studentId: string) {
  const supabase = await createSupabaseServerClient();
  const [linksResult, parentsResult] = await Promise.all([
    supabase.from("parent_student_links").select("*").eq("student_id", studentId),
    supabase.from("profiles").select("*").eq("role", "veli"),
  ]);

  if (linksResult.error || parentsResult.error) {
    throw new Error("Talebe veli bilgileri alınamadı.");
  }

  const parentMap = new Map((parentsResult.data ?? []).map((parent) => [parent.id, parent]));

  return (linksResult.data ?? [])
    .map((link) => {
      const parent = parentMap.get(link.parent_profile_id);

      if (!parent) {
        return null;
      }

      return {
        ...parent,
        relation: link.relation,
      } satisfies ReportParentRow;
    })
    .filter((parent): parent is ReportParentRow => parent !== null);
}

export type DormitoryReportRow = {
  dormitory: DormitoryRow;
  assignments: (DormitoryAssignmentRow & { student: StudentRow | null })[];
  studentCount: number;
};

export async function getDormitoryReportData() {
  const supabase = await createSupabaseServerClient();
  const { data: dormitories } = await supabase.from("dormitories").select("*").order("name");
  const { data: rawAssignments } = await supabase
    .from("dormitory_assignments")
    .select("*, student:students(*)")
    .eq("status", "active");

  const assignments = (rawAssignments ?? []) as unknown as (DormitoryAssignmentRow & { student: StudentRow | null })[];

  const assignmentMap = new Map<string, (DormitoryAssignmentRow & { student: StudentRow | null })[]>();

  for (const assignment of assignments) {
    const existing = assignmentMap.get(assignment.dormitory_id) ?? [];
    existing.push(assignment);
    assignmentMap.set(assignment.dormitory_id, existing);
  }

  return (dormitories ?? []).map((dorm) => ({
    dormitory: dorm,
    assignments: assignmentMap.get(dorm.id) ?? [],
    studentCount: assignmentMap.get(dorm.id)?.length ?? 0,
  })) satisfies DormitoryReportRow[];
}

export type TaskReportRow = {
  task: TaskRow;
  assignedTo: ProfileRow | null;
  assignedBy: ProfileRow | null;
};

export async function getTaskReportData(profile: ProfileRow) {
  const { data: tasks } = await getTasks(profile);
  const supabase = await createSupabaseServerClient();
  const { data: profiles } = await supabase.from("profiles").select("*");
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return tasks.map((task) => ({
    task,
    assignedTo: task.assigned_to ? (profileMap.get(task.assigned_to) ?? null) : null,
    assignedBy: task.assigned_by ? (profileMap.get(task.assigned_by) ?? null) : null,
  })) satisfies TaskReportRow[];
}

export type RequestReportRow = TalepRow & {
  created_by_profile: ProfileRow | null;
  assigned_to_profile: ProfileRow | null;
};

export async function getRequestReportData(profile: ProfileRow): Promise<RequestReportRow[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("talepler").select("*").order("created_at", { ascending: false });

  if (profile.role === "bolum_muduru") {
    const { data: deptProfiles } = await supabase
      .from("profiles")
      .select("id")
      .eq("department_id", profile.department_id ?? "");
    const profileIds = (deptProfiles ?? []).map((p) => p.id);
    query = query.in("requested_by", profileIds.length > 0 ? profileIds : [""]);
  }

  const { data: requests } = await query;
  const { data: profiles } = await supabase.from("profiles").select("*");
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return (requests ?? []).map((req) => ({
    ...req,
    created_by_profile: req.requested_by ? (profileMap.get(req.requested_by) ?? null) : null,
    assigned_to_profile: req.assigned_to ? (profileMap.get(req.assigned_to) ?? null) : null,
  }));
}

export type DocumentReportRow = {
  id: string;
  student_name: string;
  student_department: string | null;
  type: string;
  url: string;
  created_at: string;
};

export async function getDocumentReportData(): Promise<DocumentReportRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data: rawDocuments } = await supabase
    .from("student_documents")
    .select("*, student:students(*)")
    .order("created_at", { ascending: false })
    .limit(500);

  const documents = (rawDocuments ?? []) as unknown as (StudentDocumentRow & { student: { full_name: string } | null })[];

  return documents.map((doc) => ({
    id: doc.id,
    student_name: doc.student?.full_name ?? "Bilinmiyor",
    student_department: null,
    type: doc.document_type,
    url: doc.file_url,
    created_at: doc.created_at,
  }));
}
