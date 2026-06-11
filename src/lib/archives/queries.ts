import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { assertCanManageArchives } from "@/lib/archives/permissions";
import type { AcademicTermRow, ArchiveExportRow, ClassRow, DepartmentRow, ProfileRow, StudentRow, StudentTermSnapshotRow } from "@/types/database";

export type ArchiveExportWithCreator = ArchiveExportRow & {
  createdByProfile: Pick<ProfileRow, "id" | "full_name"> | null;
};

export type ArchiveCenterData = {
  closedTerms: AcademicTermRow[];
  students: Array<Pick<StudentRow, "id" | "full_name">>;
  departments: Array<Pick<DepartmentRow, "id" | "name">>;
  classes: Array<Pick<ClassRow, "id" | "name" | "department_id">>;
  exports: ArchiveExportWithCreator[];
};

export async function getArchiveCenterData(profile: ProfileRow): Promise<ArchiveCenterData> {
  assertCanManageArchives(profile);
  const admin = createSupabaseAdminClient();

  const [termsResult, snapshotsResult, exportsResult] = await Promise.all([
    admin.from("academic_terms").select("*").in("status", ["closed", "archived"]).order("closed_at", { ascending: false }),
    admin.from("student_term_snapshots").select("student_id,department_id,class_id"),
    admin.from("archive_exports").select("*").order("created_at", { ascending: false }).limit(50),
  ]);

  if (termsResult.error) throw new Error("Kapalı dönemler alınamadı.");
  if (snapshotsResult.error) throw new Error("Snapshot arşiv seçenekleri alınamadı.");
  if (exportsResult.error) throw new Error("Export geçmişi alınamadı.");

  const snapshots = (snapshotsResult.data ?? []) as Pick<StudentTermSnapshotRow, "student_id" | "department_id" | "class_id">[];
  const studentIds = uniqueValues(snapshots.map((snapshot) => snapshot.student_id));
  const departmentIds = uniqueValues(snapshots.map((snapshot) => snapshot.department_id));
  const classIds = uniqueValues(snapshots.map((snapshot) => snapshot.class_id));
  const createdByIds = uniqueValues((exportsResult.data ?? []).map((item) => item.created_by));

  const [studentsResult, departmentsResult, classesResult, profilesResult] = await Promise.all([
    studentIds.length > 0 ? admin.from("students").select("id,full_name").in("id", studentIds).order("full_name", { ascending: true }) : Promise.resolve({ data: [], error: null }),
    departmentIds.length > 0 ? admin.from("departments").select("id,name").in("id", departmentIds).order("name", { ascending: true }) : Promise.resolve({ data: [], error: null }),
    classIds.length > 0 ? admin.from("classes").select("id,name,department_id").in("id", classIds).order("name", { ascending: true }) : Promise.resolve({ data: [], error: null }),
    createdByIds.length > 0 ? admin.from("profiles").select("id,full_name").in("id", createdByIds) : Promise.resolve({ data: [], error: null }),
  ]);

  if (studentsResult.error) throw new Error("Öğrenci arşiv seçenekleri alınamadı.");
  if (departmentsResult.error) throw new Error("Bölüm arşiv seçenekleri alınamadı.");
  if (classesResult.error) throw new Error("Sınıf arşiv seçenekleri alınamadı.");
  if (profilesResult.error) throw new Error("Export kullanıcıları alınamadı.");

  const profileMap = new Map((profilesResult.data ?? []).map((createdBy) => [createdBy.id, createdBy]));

  return {
    closedTerms: (termsResult.data ?? []) as AcademicTermRow[],
    students: studentsResult.data ?? [],
    departments: departmentsResult.data ?? [],
    classes: classesResult.data ?? [],
    exports: ((exportsResult.data ?? []) as ArchiveExportRow[]).map((item) => ({
      ...item,
      createdByProfile: item.created_by ? profileMap.get(item.created_by) ?? null : null,
    })),
  };
}

function uniqueValues(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}
