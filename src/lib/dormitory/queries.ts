import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  ClassRow,
  DepartmentRow,
  DormitoryAssignmentRow,
  DormitoryBedRow,
  DormitoryFloorRow,
  DormitoryRow,
  DormitoryRoomRow,
  ProfileRow,
  StudentRow,
} from "@/types/database";

export type DormitoryScope = {
  classes: ClassRow[];
  departments: DepartmentRow[];
  students: StudentRow[];
  visibleStudentIds: Set<string>;
  visibleClassIds: Set<string>;
  visibleDepartmentIds: Set<string>;
};

export type DormitoryBedWithRelations = DormitoryBedRow & {
  room: DormitoryRoomRow | null;
  floor: DormitoryFloorRow | null;
  dormitory: DormitoryRow | null;
  assignment: DormitoryAssignmentWithRelations | null;
};

export type DormitoryRoomWithRelations = DormitoryRoomRow & {
  floor: DormitoryFloorRow | null;
  dormitory: DormitoryRow | null;
  beds: DormitoryBedWithRelations[];
  occupancy: {
    total: number;
    occupied: number;
    empty: number;
    percent: number;
  };
};

export type DormitoryFloorWithRelations = DormitoryFloorRow & {
  dormitory: DormitoryRow | null;
  rooms: DormitoryRoomWithRelations[];
  occupancy: {
    total: number;
    occupied: number;
    empty: number;
    percent: number;
  };
};

export type DormitoryAssignmentWithRelations = DormitoryAssignmentRow & {
  student: DormitoryStudentWithRelations | null;
  bed: DormitoryBedWithRelations | null;
  room: DormitoryRoomRow | null;
  floor: DormitoryFloorRow | null;
  dormitory: DormitoryRow | null;
  assigned_by_profile: ProfileRow | null;
};

export type DormitoryStudentWithRelations = StudentRow & {
  course_class: ClassRow | null;
  department: DepartmentRow | null;
};

export type DormitoryWithRelations = DormitoryRow & {
  floors: DormitoryFloorWithRelations[];
  rooms: DormitoryRoomWithRelations[];
  beds: DormitoryBedWithRelations[];
  assignments: DormitoryAssignmentWithRelations[];
  summary: DormitorySummary;
};

export type DormitorySummary = {
  totalDormitoryCount: number;
  totalFloorCount: number;
  totalRoomCount: number;
  totalBedCount: number;
  occupiedBedCount: number;
  emptyBedCount: number;
  occupancyPercent: number;
  activeAssignedStudentCount: number;
  unassignedActiveStudentCount: number;
};

export type DormitoryDashboard = DormitorySummary & {
  dormitories: DormitoryWithRelations[];
  floorDistribution: Array<{ id: string; name: string; percent: number; occupied: number; total: number }>;
  departmentDistribution: Array<{ id: string; name: string; percent: number; occupied: number; total: number }>;
};

export type DormitoryAssignmentFilters = {
  departmentId?: string;
  classId?: string;
  dormitoryId?: string;
  floorId?: string;
  roomId?: string;
  status?: "active" | "ended" | "all";
  unassigned?: boolean;
  search?: string;
};

export type DormitoryAssignmentListItem = DormitoryAssignmentWithRelations;

export type DormitorySelectionOptions = {
  students: DormitoryStudentWithRelations[];
  dormitories: DormitoryRow[];
  floors: DormitoryFloorRow[];
  rooms: DormitoryRoomRow[];
  beds: DormitoryBedWithRelations[];
  classes: ClassRow[];
  departments: DepartmentRow[];
};

export type DormitoryRoomDetail = DormitoryRoomWithRelations;

export type DormitoryFloorDetail = DormitoryFloorWithRelations;

export async function getDormitoryDashboard(profile: ProfileRow): Promise<DormitoryDashboard> {
  const { dormitories, floors, rooms, beds, assignments, scope } = await loadDormitoryData(profile);
  const summary = buildSummary(dormitories, floors, rooms, beds, assignments, scope);
  const dormitoryMap = buildDormitoryMaps(dormitories, floors, rooms, beds, assignments);

  return {
    ...summary,
    dormitories: dormitoryMap.dormitories,
    floorDistribution: buildFloorDistribution(floors, rooms, beds, assignments),
    departmentDistribution: buildDepartmentDistribution(scope, assignments),
  };
}

export async function getDormitoriesForProfile(profile: ProfileRow) {
  const { dormitories, floors, rooms, beds, assignments, scope } = await loadDormitoryData(profile);
  const summary = buildSummary(dormitories, floors, rooms, beds, assignments, scope);
  return buildDormitoryMaps(dormitories, floors, rooms, beds, assignments, summary).dormitories;
}

export async function getDormitoryById(profile: ProfileRow, dormitoryId: string) {
  const { dormitories, floors, rooms, beds, scope } = await loadDormitoryData(profile);
  const dormitory = dormitories.find((item) => item.id === dormitoryId) ?? null;
  if (!dormitory) {
    return null;
  }

  const visibleAssignments = await getDormitoryAssignments(profile, { status: "all", dormitoryId });
  return buildDormitoryDetail(dormitory, floors, rooms, beds, visibleAssignments, scope);
}

export async function getDormitoryFloorById(profile: ProfileRow, floorId: string) {
  const { dormitories, floors, rooms, beds } = await loadDormitoryData(profile);
  const floor = floors.find((item) => item.id === floorId) ?? null;
  if (!floor) {
    return null;
  }

  const visibleAssignments = await getDormitoryAssignments(profile, { status: "all", floorId });
  return buildFloorDetail(floor, dormitories, rooms, beds, visibleAssignments);
}

export async function getDormitoryRoomById(profile: ProfileRow, roomId: string) {
  const { dormitories, floors, rooms, beds } = await loadDormitoryData(profile);
  const room = rooms.find((item) => item.id === roomId) ?? null;
  if (!room) {
    return null;
  }

  const visibleAssignments = await getDormitoryAssignments(profile, { status: "all", roomId });
  return buildRoomDetail(room, dormitories, floors, beds, visibleAssignments);
}

export async function getDormitoryAssignments(profile: ProfileRow, filters: DormitoryAssignmentFilters = {}) {
  const { dormitories, floors, rooms, beds, assignments, students, classes, departments, profiles, scope } = await loadDormitoryData(profile);
  const visibleAssignments = filterAssignmentsForScope(assignments, scope);
  const bedMap = new Map(beds.map((bed) => [bed.id, bed]));
  const roomMap = new Map(rooms.map((room) => [room.id, room]));
  const floorMap = new Map(floors.map((floor) => [floor.id, floor]));
  const dormitoryMap = new Map(dormitories.map((dormitory) => [dormitory.id, dormitory]));
  const classMap = new Map(classes.map((courseClass) => [courseClass.id, courseClass]));
  const departmentMap = new Map(departments.map((department) => [department.id, department]));
  const profileMap = new Map(profiles.map((item) => [item.id, item]));
  const studentMap = new Map(
    students.map((student) => {
      const courseClass = student.course_class_id ? classMap.get(student.course_class_id) ?? null : null;
      return [
        student.id,
        {
          ...student,
          course_class: courseClass,
          department: courseClass ? departmentMap.get(courseClass.department_id) ?? null : null,
        } satisfies DormitoryStudentWithRelations,
      ] as const;
    }),
  );

  const visibleStudentIds = scope.visibleStudentIds;
  const items = visibleAssignments
    .map((assignment) => {
      const student = studentMap.get(assignment.student_id) ?? null;
      const bed = bedMap.get(assignment.bed_id) ?? null;
      const room = bed ? roomMap.get(bed.room_id) ?? null : null;
      const floor = room ? floorMap.get(room.floor_id) ?? null : null;
      const dormitory = floor ? dormitoryMap.get(floor.dormitory_id) ?? null : null;
      const baseAssignment = {
        ...assignment,
        student,
        room,
        floor,
        dormitory,
        assigned_by_profile: assignment.assigned_by ? profileMap.get(assignment.assigned_by) ?? null : null,
      } satisfies Omit<DormitoryAssignmentWithRelations, "bed">;

      return {
        ...baseAssignment,
        bed: bed
          ? {
              ...bed,
              room,
              floor,
              dormitory,
              assignment: baseAssignment as DormitoryAssignmentWithRelations,
            }
          : null,
      } satisfies DormitoryAssignmentWithRelations;
    })
    .filter((assignment) => {
      if (filters.status && filters.status !== "all" && assignment.status !== filters.status) {
        return false;
      }

      if (filters.dormitoryId && assignment.dormitory?.id !== filters.dormitoryId) {
        return false;
      }

      if (filters.floorId && assignment.floor?.id !== filters.floorId) {
        return false;
      }

      if (filters.roomId && assignment.room?.id !== filters.roomId) {
        return false;
      }

      if (filters.departmentId && assignment.student?.course_class_id) {
        const courseClass = classMap.get(assignment.student.course_class_id);
        if (courseClass?.department_id !== filters.departmentId) {
          return false;
        }
      } else if (filters.departmentId && !assignment.student?.course_class_id) {
        return false;
      }

      if (filters.classId && assignment.student?.course_class_id !== filters.classId) {
        return false;
      }

      if (filters.unassigned && !visibleStudentIds.has(assignment.student_id)) {
        return false;
      }

      if (filters.search) {
        const term = filters.search.trim().toLocaleLowerCase("tr-TR");
        const haystack = [
          assignment.student?.full_name ?? "",
          assignment.room?.room_no ?? "",
          assignment.room?.name ?? "",
          assignment.bed?.bed_no ?? "",
        ]
          .join(" ")
          .toLocaleLowerCase("tr-TR");

        if (!haystack.includes(term)) {
          return false;
        }
      }

      return true;
    });

  return items;
}

export async function getDormitoryAssignmentById(profile: ProfileRow, assignmentId: string) {
  const assignments = await getDormitoryAssignments(profile, {});
  return assignments.find((assignment) => assignment.id === assignmentId) ?? null;
}

export async function getDormitorySelectionOptions(profile: ProfileRow): Promise<DormitorySelectionOptions> {
  const { dormitories, floors, rooms, beds, students, classes, departments, scope } = await loadDormitoryData(profile);
  const classMap = new Map(classes.map((courseClass) => [courseClass.id, courseClass]));
  const departmentMap = new Map(departments.map((department) => [department.id, department]));
  const activeAssignments = await getDormitoryAssignments(profile, { status: "active" });
  const assignedStudentIds = new Set(activeAssignments.map((assignment) => assignment.student_id));

  const visibleStudents: DormitoryStudentWithRelations[] = students
    .filter((student) => scope.visibleStudentIds.has(student.id))
    .map((student) => ({
      ...student,
      course_class: student.course_class_id ? classMap.get(student.course_class_id) ?? null : null,
      department: student.course_class_id
        ? departmentMap.get(classMap.get(student.course_class_id)?.department_id ?? "") ?? null
        : null,
    }))
    .sort((left, right) => {
      const leftAssigned = assignedStudentIds.has(left.id) ? 1 : 0;
      const rightAssigned = assignedStudentIds.has(right.id) ? 1 : 0;
      if (leftAssigned !== rightAssigned) {
        return leftAssigned - rightAssigned;
      }
      return left.full_name.localeCompare(right.full_name, "tr");
    });

  return {
    students: visibleStudents,
    dormitories: dormitories.filter((dormitory) => dormitory.is_active),
    floors: floors.filter((floor) => floor.is_active),
    rooms: rooms.filter((room) => room.is_active),
    beds: beds.filter((bed) => bed.is_active).map((bed) => ({
      ...bed,
      room: rooms.find((room) => room.id === bed.room_id) ?? null,
      floor: floors.find((floor) => floor.id === (rooms.find((room) => room.id === bed.room_id)?.floor_id ?? "")) ?? null,
      dormitory:
        dormitories.find((dormitory) => dormitory.id === floors.find((floor) => floor.id === (rooms.find((room) => room.id === bed.room_id)?.floor_id ?? ""))?.dormitory_id) ??
        null,
      assignment: activeAssignments.find((assignment) => assignment.bed_id === bed.id) ?? null,
    })),
    classes: classes.filter((courseClass) => scope.visibleClassIds.has(courseClass.id)),
    departments: departments.filter((department) => scope.visibleDepartmentIds.has(department.id)),
  };
}

export async function getStudentDormitoryAssignment(studentId: string) {
  const supabase = await createSupabaseServerClient();
  const [{ data: assignments, error }, { data: beds }, { data: rooms }, { data: floors }, { data: dormitories }, { data: students }, { data: classes }, { data: departments }, { data: profiles }] = await Promise.all([
    supabase.from("dormitory_assignments").select("*").eq("student_id", studentId).order("created_at", { ascending: false }),
    supabase.from("dormitory_beds").select("*"),
    supabase.from("dormitory_rooms").select("*"),
    supabase.from("dormitory_floors").select("*"),
    supabase.from("dormitories").select("*"),
    supabase.from("students").select("*").eq("id", studentId).maybeSingle(),
    supabase.from("classes").select("*"),
    supabase.from("departments").select("*"),
    supabase.from("profiles").select("*"),
  ]);

  if (error) {
    throw new Error("Yerleşim kaydı alınamadı.");
  }

  const bedMap = new Map((beds ?? []).map((bed) => [bed.id, bed]));
  const roomMap = new Map((rooms ?? []).map((room) => [room.id, room]));
  const floorMap = new Map((floors ?? []).map((floor) => [floor.id, floor]));
  const dormitoryMap = new Map((dormitories ?? []).map((dormitory) => [dormitory.id, dormitory]));
  const classMap = new Map(((classes ?? []) as ClassRow[]).map((courseClass) => [courseClass.id, courseClass]));
  const departmentMap = new Map(((departments ?? []) as DepartmentRow[]).map((department) => [department.id, department]));
  const profileMap = new Map(((profiles ?? []) as ProfileRow[]).map((profile) => [profile.id, profile]));
  const currentStudent = (students as StudentRow | null) ?? null;
  const currentClass = currentStudent?.course_class_id ? classMap.get(currentStudent.course_class_id) ?? null : null;
  const studentRelation = currentStudent
    ? {
        ...currentStudent,
        course_class: currentClass,
        department: currentClass ? departmentMap.get(currentClass.department_id) ?? null : null,
      } satisfies DormitoryStudentWithRelations
    : null;

  return (assignments ?? []).map((assignment) => {
    const bed = bedMap.get(assignment.bed_id) ?? null;
    const room = bed ? roomMap.get(bed.room_id) ?? null : null;
    const floor = room ? floorMap.get(room.floor_id) ?? null : null;
    const dormitory = floor ? dormitoryMap.get(floor.dormitory_id) ?? null : null;
    const baseAssignment = {
      ...assignment,
      room,
      floor,
      dormitory,
      student: studentRelation,
      assigned_by_profile: assignment.assigned_by ? profileMap.get(assignment.assigned_by) ?? null : null,
    } satisfies Omit<DormitoryAssignmentWithRelations, "bed">;

    return {
      ...baseAssignment,
      bed: bed
        ? {
            ...bed,
            room,
            floor,
            dormitory,
            assignment: baseAssignment as DormitoryAssignmentWithRelations,
          }
        : null,
    } satisfies DormitoryAssignmentWithRelations;
  });
}

export async function getDormitoryReportData(profile: ProfileRow) {
  return getDormitoryDashboard(profile);
}

async function loadDormitoryData(profile: ProfileRow) {
  const supabase = await createSupabaseServerClient();
  const [
    dormitoriesResult,
    floorsResult,
    roomsResult,
    bedsResult,
    assignmentsResult,
    studentsResult,
    classesResult,
    departmentsResult,
    profilesResult,
  ] = await Promise.all([
    supabase.from("dormitories").select("*").order("name", { ascending: true }),
    supabase.from("dormitory_floors").select("*").order("floor_no", { ascending: true, nullsFirst: true }),
    supabase.from("dormitory_rooms").select("*").order("room_no", { ascending: true, nullsFirst: true }),
    supabase.from("dormitory_beds").select("*").order("bed_no", { ascending: true }),
    supabase.from("dormitory_assignments").select("*").order("created_at", { ascending: false }),
    supabase.from("students").select("*"),
    supabase.from("classes").select("*"),
    supabase.from("departments").select("*"),
    supabase.from("profiles").select("*"),
  ]);

  const dormitories = (dormitoriesResult.data ?? []) as DormitoryRow[];
  const floors = (floorsResult.data ?? []) as DormitoryFloorRow[];
  const rooms = (roomsResult.data ?? []) as DormitoryRoomRow[];
  const beds = (bedsResult.data ?? []) as DormitoryBedRow[];
  const assignments = (assignmentsResult.data ?? []) as DormitoryAssignmentRow[];
  const students = (studentsResult.data ?? []) as StudentRow[];
  const classes = (classesResult.data ?? []) as ClassRow[];
  const departments = (departmentsResult.data ?? []) as DepartmentRow[];
  const profiles = (profilesResult.data ?? []) as ProfileRow[];

  const scope = buildScope(profile, students, classes, departments);
  return { dormitories, floors, rooms, beds, assignments, students, classes, departments, profiles, scope };
}

function buildScope(profile: ProfileRow, students: StudentRow[], classes: ClassRow[], departments: DepartmentRow[]): DormitoryScope {
  if (profile.role === "admin" || profile.role === "genel_mudur") {
    return {
      classes,
      departments,
      students,
      visibleStudentIds: new Set(students.map((student) => student.id)),
      visibleClassIds: new Set(classes.map((courseClass) => courseClass.id)),
      visibleDepartmentIds: new Set(departments.map((department) => department.id)),
    };
  }

  if (profile.role === "bolum_muduru") {
    const visibleClasses = classes.filter((courseClass) => courseClass.department_id === profile.department_id);
    const visibleClassIds = new Set(visibleClasses.map((courseClass) => courseClass.id));
    const visibleStudents = students.filter((student) => student.course_class_id && visibleClassIds.has(student.course_class_id));
    return {
      classes: visibleClasses,
      departments: departments.filter((department) => department.id === profile.department_id),
      students: visibleStudents,
      visibleStudentIds: new Set(visibleStudents.map((student) => student.id)),
      visibleClassIds,
      visibleDepartmentIds: new Set(profile.department_id ? [profile.department_id] : []),
    };
  }

  if (profile.role === "hoca") {
    const visibleClasses = classes.filter((courseClass) => courseClass.class_teacher_id === profile.id);
    const visibleClassIds = new Set(visibleClasses.map((courseClass) => courseClass.id));
    const visibleStudents = students.filter((student) => student.course_class_id && visibleClassIds.has(student.course_class_id));
    const visibleDepartmentIds = new Set(visibleClasses.map((courseClass) => courseClass.department_id));
    return {
      classes: visibleClasses,
      departments: departments.filter((department) => visibleDepartmentIds.has(department.id)),
      students: visibleStudents,
      visibleStudentIds: new Set(visibleStudents.map((student) => student.id)),
      visibleClassIds,
      visibleDepartmentIds,
    };
  }

  return {
    classes: [],
    departments: [],
    students: [],
    visibleStudentIds: new Set(),
    visibleClassIds: new Set(),
    visibleDepartmentIds: new Set(),
  };
}

function filterAssignmentsForScope(assignments: DormitoryAssignmentRow[], scope: DormitoryScope) {
  if (scope.visibleStudentIds.size === 0) {
    return [];
  }

  return assignments.filter((assignment) => scope.visibleStudentIds.has(assignment.student_id));
}

function buildSummary(
  dormitories: DormitoryRow[],
  floors: DormitoryFloorRow[],
  rooms: DormitoryRoomRow[],
  beds: DormitoryBedRow[],
  assignments: DormitoryAssignmentRow[],
  scope: DormitoryScope,
): DormitorySummary {
  const activeAssignments = assignments.filter((assignment) => assignment.status === "active");
  const visibleAssignments = filterAssignmentsForScope(activeAssignments, scope);
  const occupiedBedCount = visibleAssignments.length;
  const totalActiveStudents = scope.students.filter((student) => student.status === "active").length;
  return {
    totalDormitoryCount: dormitories.length,
    totalFloorCount: floors.length,
    totalRoomCount: rooms.length,
    totalBedCount: beds.length,
    occupiedBedCount,
    emptyBedCount: Math.max(beds.length - occupiedBedCount, 0),
    occupancyPercent: beds.length > 0 ? Math.round((occupiedBedCount / beds.length) * 10000) / 100 : 0,
    activeAssignedStudentCount: visibleAssignments.length,
    unassignedActiveStudentCount: Math.max(totalActiveStudents - visibleAssignments.length, 0),
  };
}

function buildDormitoryMaps(
  dormitories: DormitoryRow[],
  floors: DormitoryFloorRow[],
  rooms: DormitoryRoomRow[],
  beds: DormitoryBedRow[],
  assignments: DormitoryAssignmentRow[],
  summary?: DormitorySummary,
) {
  const dormitoryMap = new Map(dormitories.map((dormitory) => [dormitory.id, dormitory]));
  const floorMap = new Map(floors.map((floor) => [floor.id, floor]));
  const roomMap = new Map(rooms.map((room) => [room.id, room]));
  const assignmentMap = new Map(assignments.filter((assignment) => assignment.status === "active").map((assignment) => [assignment.bed_id, assignment]));

  const bedRelations: DormitoryBedWithRelations[] = beds.map((bed) => {
    const room = roomMap.get(bed.room_id) ?? null;
    const floor = room ? floorMap.get(room.floor_id) ?? null : null;
    const dormitory = floor ? dormitoryMap.get(floor.dormitory_id) ?? null : null;
    const assignment = assignmentMap.get(bed.id) ?? null;
    return {
      ...bed,
      room,
      floor,
      dormitory,
      assignment: assignment
        ? {
            ...assignment,
            student: null,
            bed: null,
            room,
            floor,
            dormitory,
            assigned_by_profile: null,
          }
        : null,
    };
  });

  const roomRelations: DormitoryRoomWithRelations[] = rooms.map((room) => {
    const roomBeds = bedRelations.filter((bed) => bed.room_id === room.id);
    return {
      ...room,
      floor: floorMap.get(room.floor_id) ?? null,
      dormitory: floorMap.get(room.floor_id) ? dormitoryMap.get(floorMap.get(room.floor_id)?.dormitory_id ?? "") ?? null : null,
      beds: roomBeds,
      occupancy: calculateOccupancy(roomBeds, room.capacity),
    };
  });

  const floorRelations: DormitoryFloorWithRelations[] = floors.map((floor) => {
    const floorRooms = roomRelations.filter((room) => room.floor_id === floor.id);
    return {
      ...floor,
      dormitory: dormitoryMap.get(floor.dormitory_id) ?? null,
      rooms: floorRooms,
      occupancy: calculateFloorOccupancy(floorRooms),
    };
  });

  const dormitoryRelations: DormitoryWithRelations[] = dormitories.map((dormitory) => {
    const dormitoryFloors = floorRelations.filter((floor) => floor.dormitory_id === dormitory.id);
    const dormitoryRooms = roomRelations.filter((room) => room.dormitory?.id === dormitory.id);
    const dormitoryBeds = bedRelations.filter((bed) => bed.dormitory?.id === dormitory.id);
    return {
      ...dormitory,
      floors: dormitoryFloors,
      rooms: dormitoryRooms,
      beds: dormitoryBeds,
      assignments: [],
      summary: summary ?? {
        totalDormitoryCount: 0,
        totalFloorCount: 0,
        totalRoomCount: 0,
        totalBedCount: 0,
        occupiedBedCount: 0,
        emptyBedCount: 0,
        occupancyPercent: 0,
        activeAssignedStudentCount: 0,
        unassignedActiveStudentCount: 0,
      },
    };
  });

  return { dormitories: dormitoryRelations, floors: floorRelations, rooms: roomRelations, beds: bedRelations };
}

function buildDormitoryDetail(
  dormitory: DormitoryRow,
  floors: DormitoryFloorRow[],
  rooms: DormitoryRoomRow[],
  beds: DormitoryBedRow[],
  assignments: DormitoryAssignmentWithRelations[],
  scope: DormitoryScope,
) {
  const dormitoryFloors = floors.filter((floor) => floor.dormitory_id === dormitory.id);
  const floorMap = new Map(dormitoryFloors.map((floor) => [floor.id, floor]));
  const dormitoryRooms = rooms.filter((room) => floorMap.has(room.floor_id));
  const roomMap = new Map(dormitoryRooms.map((room) => [room.id, room]));
  const dormitoryBeds = beds.filter((bed) => roomMap.has(bed.room_id));
  const visibleAssignments = assignments.filter((assignment) => assignment.bed?.dormitory?.id === dormitory.id || assignment.dormitory?.id === dormitory.id);
  const activeAssignments = visibleAssignments.filter((assignment) => assignment.status === "active");

  const bedRelations = dormitoryBeds.map((bed) => {
    const room = roomMap.get(bed.room_id) ?? null;
    const floor = room ? floorMap.get(room.floor_id) ?? null : null;
    const assignment = activeAssignments.find((item) => item.bed_id === bed.id) ?? null;
    return {
      ...bed,
      room,
      floor,
      dormitory,
      assignment,
    } satisfies DormitoryBedWithRelations;
  });

  const roomRelations = dormitoryRooms.map((room) => {
    const roomBeds = bedRelations.filter((bed) => bed.room_id === room.id);
    return {
      ...room,
      floor: floorMap.get(room.floor_id) ?? null,
      dormitory,
      beds: roomBeds,
      occupancy: calculateOccupancy(roomBeds, room.capacity),
    };
  });

  const floorRelations = dormitoryFloors.map((floor) => {
    const floorRooms = roomRelations.filter((room) => room.floor_id === floor.id);
    return {
      ...floor,
      dormitory,
      rooms: floorRooms,
      occupancy: calculateFloorOccupancy(floorRooms),
    };
  });

  return {
    ...dormitory,
    floors: floorRelations,
    rooms: roomRelations,
    beds: bedRelations,
    assignments: visibleAssignments,
    summary: buildSummary([dormitory], dormitoryFloors, dormitoryRooms, dormitoryBeds, visibleAssignments, scope),
  } satisfies DormitoryWithRelations;
}

function buildFloorDetail(
  floor: DormitoryFloorRow,
  dormitories: DormitoryRow[],
  rooms: DormitoryRoomRow[],
  beds: DormitoryBedRow[],
  assignments: DormitoryAssignmentWithRelations[],
) {
  const dormitory = dormitories.find((item) => item.id === floor.dormitory_id) ?? null;
  const floorRooms = rooms.filter((room) => room.floor_id === floor.id);
  const roomMap = new Map(floorRooms.map((room) => [room.id, room]));
  const floorBeds = beds.filter((bed) => roomMap.has(bed.room_id));
  const activeAssignments = assignments.filter((assignment) => assignment.status === "active");
  const bedRelations = floorBeds.map((bed) => {
    const room = roomMap.get(bed.room_id) ?? null;
    const assignment = activeAssignments.find((item) => item.bed_id === bed.id) ?? null;
    return {
      ...bed,
      room,
      floor,
      dormitory,
      assignment,
    } satisfies DormitoryBedWithRelations;
  });

  const roomRelations = floorRooms.map((room) => {
    const roomBeds = bedRelations.filter((bed) => bed.room_id === room.id);
    return {
      ...room,
      floor,
      dormitory,
      beds: roomBeds,
      occupancy: calculateOccupancy(roomBeds, room.capacity),
    };
  });

  return {
    ...floor,
    dormitory,
    rooms: roomRelations,
    occupancy: calculateFloorOccupancy(roomRelations),
  } satisfies DormitoryFloorWithRelations;
}

function buildRoomDetail(
  room: DormitoryRoomRow,
  dormitories: DormitoryRow[],
  floors: DormitoryFloorRow[],
  beds: DormitoryBedRow[],
  assignments: DormitoryAssignmentWithRelations[],
) {
  const floor = floors.find((item) => item.id === room.floor_id) ?? null;
  const dormitory = floor ? dormitories.find((item) => item.id === floor.dormitory_id) ?? null : null;
  const roomBeds = beds.filter((bed) => bed.room_id === room.id);
  const activeAssignments = assignments.filter((assignment) => assignment.status === "active");
  const bedRelations = roomBeds.map((bed) => {
    const assignment = activeAssignments.find((item) => item.bed_id === bed.id) ?? null;
    return {
      ...bed,
      room,
      floor,
      dormitory,
      assignment,
    } satisfies DormitoryBedWithRelations;
  });

  return {
    ...room,
    floor,
    dormitory,
    beds: bedRelations,
    occupancy: calculateOccupancy(bedRelations, room.capacity),
  } satisfies DormitoryRoomWithRelations;
}

function calculateOccupancy(beds: DormitoryBedWithRelations[], capacity: number) {
  const total = Math.max(beds.length, capacity);
  const occupied = beds.filter((bed) => bed.assignment && bed.is_active).length;
  const empty = Math.max(total - occupied, 0);
  return {
    total,
    occupied,
    empty,
    percent: total > 0 ? Math.round((occupied / total) * 10000) / 100 : 0,
  };
}

function calculateFloorOccupancy(rooms: DormitoryRoomWithRelations[]) {
  const total = rooms.reduce((sum, room) => sum + room.occupancy.total, 0);
  const occupied = rooms.reduce((sum, room) => sum + room.occupancy.occupied, 0);
  const empty = Math.max(total - occupied, 0);
  return {
    total,
    occupied,
    empty,
    percent: total > 0 ? Math.round((occupied / total) * 10000) / 100 : 0,
  };
}

function buildFloorDistribution(floors: DormitoryFloorRow[], rooms: DormitoryRoomRow[], beds: DormitoryBedRow[], assignments: DormitoryAssignmentRow[]) {
  const roomAssignmentMap = new Map(
    assignments
      .filter((assignment) => assignment.status === "active")
      .map((assignment) => [assignment.bed_id, assignment] as const),
  );
  const bedMap = new Map(beds.filter((bed) => bed.is_active).map((bed) => [bed.id, bed] as const));
  const roomMap = new Map(rooms.filter((room) => room.is_active).map((room) => [room.id, room] as const));
  return floors.map((floor) => {
    const floorRoomIds = new Set(Array.from(roomMap.values()).filter((room) => room.floor_id === floor.id).map((room) => room.id));
    const floorBeds = Array.from(bedMap.values()).filter((bed) => floorRoomIds.has(bed.room_id));
    const occupied = floorBeds.filter((bed) => roomAssignmentMap.has(bed.id)).length;
    const total = Math.max(floorBeds.length, 1);
    return {
      id: floor.id,
      name: floor.name,
      occupied,
      total,
      percent: total > 0 ? Math.round((occupied / total) * 10000) / 100 : 0,
    };
  });
}

function buildDepartmentDistribution(scope: DormitoryScope, assignments: DormitoryAssignmentRow[]) {
  const classMap = new Map(scope.classes.map((courseClass) => [courseClass.id, courseClass]));
  return scope.departments.map((department) => {
    const departmentStudentIds = scope.students
      .filter((student) => student.course_class_id && classMap.get(student.course_class_id)?.department_id === department.id)
      .map((student) => student.id);
    const departmentAssignments = assignments.filter((assignment) => departmentStudentIds.includes(assignment.student_id) && assignment.status === "active");
    const total = Math.max(departmentStudentIds.length, 1);
    return {
      id: department.id,
      name: department.name,
      occupied: departmentAssignments.length,
      total,
      percent: total > 0 ? Math.round((departmentAssignments.length / total) * 10000) / 100 : 0,
    };
  });
}
