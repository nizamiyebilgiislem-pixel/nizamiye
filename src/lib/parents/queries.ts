import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  ClassRow,
  DepartmentRow,
  ParentStudentLinkRow,
  ProfileRow,
  StudentRow,
} from "@/types/database";
import { isGlobalViewRole } from "@/types/rbac";

export type ParentVisibleStudent = StudentRow & {
  course_class: ClassRow | null;
  department: DepartmentRow | null;
  relation: string | null;
};

export type ParentProfileListItem = ProfileRow & {
  linked_student_count: number;
  linked_students: ParentVisibleStudent[];
};

export type ParentProfileFilters = {
  search?: string;
  status?: string;
};

export type ParentProfileDetail = ProfileRow & {
  linked_students: ParentVisibleStudent[];
};

export type StudentParentLinkProfile = ProfileRow & {
  relation: string | null;
};

export async function getVisibleStudentsForParentManagement(profile: ProfileRow) {
  const supabase = await createSupabaseServerClient();
  const [{ data: classes, error: classesError }, { data: departments }, { data: students, error: studentsError }] = await Promise.all([
    supabase.from("classes").select("*").eq("is_active", true).order("name", { ascending: true }),
    supabase.from("departments").select("*").eq("is_active", true),
    supabase.from("students").select("*").eq("status", "active").order("full_name", { ascending: true }),
  ]);

  if (classesError || studentsError) {
    throw new Error("Veli yönetimi için talebe listesi alınamadı.");
  }

  const visibleClasses = filterClassesForParentManagement(profile, classes ?? []);
  const visibleClassIds = new Set(visibleClasses.map((classRow) => classRow.id));
  const departmentMap = new Map((departments ?? []).map((department) => [department.id, department]));
  const classMap = new Map(visibleClasses.map((classRow) => [classRow.id, classRow]));

  return (students ?? [])
    .filter((student) => student.course_class_id && visibleClassIds.has(student.course_class_id))
    .map((student) => {
      const courseClass = student.course_class_id ? classMap.get(student.course_class_id) ?? null : null;

      return {
        ...student,
        course_class: courseClass,
        department: courseClass ? departmentMap.get(courseClass.department_id) ?? null : null,
        relation: null,
      };
    });
}

export async function getParentProfilesForProfile(profile: ProfileRow, filters: ParentProfileFilters = {}) {
  const supabase = await createSupabaseServerClient();
  const [visibleStudents, parentsResult, linksResult] = await Promise.all([
    getVisibleStudentsForParentManagement(profile),
    supabase.from("profiles").select("*").eq("role", "veli").order("full_name", { ascending: true }),
    supabase.from("parent_student_links").select("*"),
  ]);

  if (parentsResult.error || linksResult.error) {
    throw new Error("Veli listesi alınamadı.");
  }

  const visibleStudentIds = new Set(visibleStudents.map((student) => student.id));
  const visibleLinks = (linksResult.data ?? []).filter((link) => visibleStudentIds.has(link.student_id));
  const linksByParentId = new Map<string, ParentStudentLinkRow[]>();

  visibleLinks.forEach((link) => {
    const group = linksByParentId.get(link.parent_profile_id) ?? [];
    group.push(link);
    linksByParentId.set(link.parent_profile_id, group);
  });

  const visibleParents = (parentsResult.data ?? [])
    .filter((parent) => {
      if (isGlobalViewRole(profile.role)) {
        return true;
      }

      return linksByParentId.has(parent.id);
    })
    .filter((parent) => {
      if (filters.status === "active") {
        return parent.is_active;
      }

      if (filters.status === "passive") {
        return !parent.is_active;
      }

      return true;
    })
    .map((parent) => attachParentLinkedStudents(parent, visibleStudents, linksByParentId.get(parent.id) ?? []));

  return {
    parents: filterParentProfiles(visibleParents, filters.search),
    students: visibleStudents,
  };
}

export async function getParentProfileByIdForProfile(profile: ProfileRow, parentId: string) {
  const supabase = await createSupabaseServerClient();
  const [parentResult, visibleStudents, linksResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", parentId).eq("role", "veli").maybeSingle(),
    getVisibleStudentsForParentManagement(profile),
    supabase.from("parent_student_links").select("*").eq("parent_profile_id", parentId),
  ]);

  if (parentResult.error || linksResult.error) {
    throw new Error("Veli detayı alınamadı.");
  }

  if (!parentResult.data) {
    return null;
  }

  const visibleStudentMap = new Map(visibleStudents.map((student) => [student.id, student]));
  const linkedStudents = (linksResult.data ?? [])
    .map((link) => {
      const student = visibleStudentMap.get(link.student_id);

      if (!student) {
        return null;
      }

      return {
        ...student,
        relation: link.relation,
      } satisfies ParentVisibleStudent;
    })
    .filter((student) => student !== null);

  return {
    ...parentResult.data,
    linked_students: linkedStudents,
  } satisfies ParentProfileDetail;
}

export async function getParentSelectionOptionsForStudent(profile: ProfileRow, studentId: string) {
  const supabase = await createSupabaseServerClient();
  const [visibleStudents, parentsResult, linksResult] = await Promise.all([
    getVisibleStudentsForParentManagement(profile),
    supabase.from("profiles").select("*").eq("role", "veli").order("full_name", { ascending: true }),
    supabase.from("parent_student_links").select("*").eq("student_id", studentId),
  ]);

  if (parentsResult.error || linksResult.error) {
    throw new Error("Veli seçim verileri alınamadı.");
  }

  const visibleStudentIds = new Set(visibleStudents.map((student) => student.id));
  const linkedParentIds = new Set((linksResult.data ?? []).map((link) => link.parent_profile_id));
  const visibleParentIds = await getVisibleParentIdsForStudents(profile, visibleStudentIds);

  return (parentsResult.data ?? [])
    .filter((parent) => visibleParentIds.has(parent.id))
    .filter((parent) => !linkedParentIds.has(parent.id))
    .map((parent) => ({
      id: parent.id,
      full_name: parent.full_name,
      email: parent.email,
      phone: parent.phone,
    }));
}

export async function getParentProfilesByStudentId(profile: ProfileRow, studentId: string) {
  const supabase = await createSupabaseServerClient();
  const [parentProfilesResult, linksResult, visibleStudents] = await Promise.all([
    supabase.from("profiles").select("*").eq("role", "veli"),
    supabase.from("parent_student_links").select("*").eq("student_id", studentId),
    getVisibleStudentsForParentManagement(profile),
  ]);

  if (parentProfilesResult.error || linksResult.error) {
    throw new Error("Talebe veli bağlantıları alınamadı.");
  }

  const visibleStudentIds = new Set(visibleStudents.map((student) => student.id));

  if (!visibleStudentIds.has(studentId) && !isGlobalViewRole(profile.role)) {
    return [];
  }

  const parentMap = new Map((parentProfilesResult.data ?? []).map((parent) => [parent.id, parent]));

  return (linksResult.data ?? [])
    .map((link) => {
      const parent = parentMap.get(link.parent_profile_id);

      if (!parent) {
        return null;
      }

      return {
        ...parent,
        relation: link.relation,
      } satisfies StudentParentLinkProfile;
    })
    .filter((parent) => parent !== null);
}

async function getVisibleParentIdsForStudents(profile: ProfileRow, visibleStudentIds: Set<string>) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("parent_student_links").select("parent_profile_id,student_id");

  if (error) {
    throw new Error("Veli görünürlük bilgisi alınamadı.");
  }

  const ids = new Set<string>();

  (data ?? []).forEach((link) => {
    if (isGlobalViewRole(profile.role) || visibleStudentIds.has(link.student_id)) {
      ids.add(link.parent_profile_id);
    }
  });

  return ids;
}

function attachParentLinkedStudents(parent: ProfileRow, students: ParentVisibleStudent[], links: ParentStudentLinkRow[]) {
  const studentMap = new Map(students.map((student) => [student.id, student]));
  const linkedStudents = links
    .map((link) => {
      const student = studentMap.get(link.student_id);

      if (!student) {
        return null;
      }

      return {
        ...student,
        relation: link.relation,
      } satisfies ParentVisibleStudent;
    })
    .filter((student) => student !== null);

  return {
    ...parent,
    linked_student_count: linkedStudents.length,
    linked_students: linkedStudents,
  } satisfies ParentProfileListItem;
}

function filterParentProfiles(parents: ParentProfileListItem[], search?: string) {
  if (!search) {
    return parents;
  }

  const term = search.trim().toLocaleLowerCase("tr-TR");

  return parents.filter((parent) =>
    [parent.full_name, parent.email, parent.phone, ...parent.linked_students.map((student) => student.full_name)]
      .filter(Boolean)
      .some((value) => value?.toLocaleLowerCase("tr-TR").includes(term)),
  );
}

function filterClassesForParentManagement(profile: ProfileRow, classes: ClassRow[]) {
  if (isGlobalViewRole(profile.role)) {
    return classes;
  }

  if (profile.role === "rehberlik") {
    return classes;
  }

  if (profile.role === "bolum_muduru") {
    return classes.filter((classRow) => classRow.department_id === profile.department_id);
  }

  if (profile.role === "hoca") {
    return classes.filter((classRow) => classRow.class_teacher_id === profile.id);
  }

  return [];
}
