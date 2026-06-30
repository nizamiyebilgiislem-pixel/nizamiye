import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { getAvailableStudentsScope } from "../src/lib/dormitory/available-students-permissions.ts";
import { getNavigationForRole } from "../src/lib/navigation.ts";
import { getDefaultPathForRole, getRouteAllowedRoles } from "../src/lib/route-permissions.ts";
import { canManageAttendance } from "../src/lib/attendance/permissions.ts";
import { canEditStudentDocuments } from "../src/lib/documents/permissions.ts";
import { canEditStudentEvaluations } from "../src/lib/evaluations/permissions.ts";
import { canEditStudentGrades } from "../src/lib/grades/permissions.ts";
import { canEditInfirmaryRecord } from "../src/lib/infirmary/permissions.ts";
import { canBindParentFromStudentDetail } from "../src/lib/parents/permissions.ts";
import { canManageAcademicTerms } from "../src/lib/terms/management-permissions.ts";
import { canManageGuidance, canViewGuidance } from "../src/lib/guidance/permissions.ts";
import { isAssignableRole } from "../src/lib/tasks/permissions.ts";
import { canCreateStudent, canViewArchive, canViewStudent } from "../src/lib/students/permissions.ts";
import { canCreateTalep } from "../src/lib/talepler/permissions.ts";
import { roles } from "../src/types/rbac.ts";

const rlsMigration = readFileSync("supabase/migrations/00038_security_hardening_rls.sql", "utf8");
const hafizlikVisibilityMigration = readFileSync("supabase/migrations/00048_hafizlik_progress_department_visibility.sql", "utf8");

function profile(role, overrides = {}) {
  return {
    id: overrides.id ?? "profile-id",
    role,
    department_id: overrides.department_id ?? null,
    is_active: true,
  };
}

test("available students API scope denies unsupported roles", () => {
  for (const role of ["veli", "destek_birim_muduru", "rehberlik", "kutuphane_gorevlisi", "muhasebe", "hoca"]) {
    assert.deepEqual(getAvailableStudentsScope(profile(role)), { allowed: false });
  }
});

test("available students API scope allows only top management and scoped department managers", () => {
  assert.deepEqual(getAvailableStudentsScope(profile("admin")), { allowed: true, kind: "all" });
  assert.deepEqual(getAvailableStudentsScope(profile("genel_mudur")), { allowed: true, kind: "all" });
  assert.deepEqual(getAvailableStudentsScope(profile("bolum_muduru", { department_id: "dep-1" })), {
    allowed: true,
    kind: "department",
    departmentId: "dep-1",
  });
  assert.deepEqual(getAvailableStudentsScope(profile("bolum_muduru")), { allowed: false });
});

test("muhasebe role is not assignable and cannot use active modules", () => {
  assert.equal(roles.includes("muhasebe"), false);
  assert.equal(isAssignableRole("muhasebe"), false);
  assert.equal(getRouteAllowedRoles("/asistan")?.includes("muhasebe"), false);
  assert.equal(getDefaultPathForRole("muhasebe"), "/hesabim");
});

test("rehberlik role only sees the trimmed navigation and allowed routes", () => {
  assert.equal(getRouteAllowedRoles("/dashboard")?.includes("rehberlik"), true);
  assert.equal(getRouteAllowedRoles("/talebeler")?.includes("rehberlik"), true);
  assert.equal(getRouteAllowedRoles("/bolumler")?.includes("rehberlik"), true);
  assert.equal(getRouteAllowedRoles("/duyurular")?.includes("rehberlik"), true);
  assert.equal(getRouteAllowedRoles("/duyurular/yeni")?.includes("rehberlik"), true);
  assert.equal(getRouteAllowedRoles("/talebeler/123/duzenle")?.includes("rehberlik"), false);
  assert.equal(getRouteAllowedRoles("/veliler")?.includes("rehberlik"), true);
  assert.equal(getRouteAllowedRoles("/veliler/123/duzenle")?.includes("rehberlik"), false);
  assert.equal(getRouteAllowedRoles("/veliler/123/talebeler")?.includes("rehberlik"), false);
  assert.equal(getRouteAllowedRoles("/talepler")?.includes("rehberlik"), false);
  assert.equal(getRouteAllowedRoles("/gorevler")?.includes("rehberlik"), false);

  const nav = getNavigationForRole("rehberlik");
  const labels = nav.flatMap((group) => group.items.map((item) => item.label));
  assert.deepEqual(labels.sort(), ["Bölümler", "Dashboard", "Duyurular", "Rehberlik", "Talebeler", "Veliler"]);
});

test("hoca role can access hafizlik module from navigation and routes", () => {
  assert.equal(getRouteAllowedRoles("/hafizlik")?.includes("hoca"), true);
  assert.equal(getRouteAllowedRoles("/hafizlik/guncelle")?.includes("hoca"), true);

  const nav = getNavigationForRole("hoca");
  const labels = nav.flatMap((group) => group.items.map((item) => item.label));

  assert.equal(labels.includes("Hafızlık Takibi"), true);
});

test("rehberlik can view students but cannot create students or talepler", () => {
  assert.equal(canViewStudent(profile("rehberlik"), { department_id: "dep-1" }), true);
  assert.equal(canCreateStudent(profile("rehberlik")), false);
  assert.equal(canCreateTalep(profile("rehberlik")), false);
  assert.equal(canViewArchive(profile("rehberlik")), false);
});

test("rehberlik cannot use academic write helpers", async () => {
  const rehberlik = profile("rehberlik");

  assert.equal(canViewGuidance(rehberlik), true);
  assert.equal(await canManageGuidance(rehberlik), true);
  assert.equal(canManageAcademicTerms(rehberlik), false);
  assert.equal(canManageAttendance(rehberlik), false);
  assert.equal(canEditStudentGrades(rehberlik, { status: "active" }, { department_id: "dep-1", class_teacher_id: null }, []), false);
  assert.equal(canEditStudentEvaluations(rehberlik, { status: "active" }, { department_id: "dep-1", class_teacher_id: null }), false);
  assert.equal(canEditInfirmaryRecord(rehberlik, { status: "active" }, { department_id: "dep-1", class_teacher_id: null }), false);
  assert.equal(canEditStudentDocuments(rehberlik, { status: "active" }, { department_id: "dep-1", class_teacher_id: null }), false);
  assert.equal(canBindParentFromStudentDetail(rehberlik), false);
});

test("yonetim role can view global routes but cannot use write helpers", async () => {
  const yonetim = profile("yonetim");

  assert.equal(roles.includes("yonetim"), true);
  assert.equal(getRouteAllowedRoles("/dashboard")?.includes("yonetim"), true);
  assert.equal(getRouteAllowedRoles("/kullanicilar")?.includes("yonetim"), true);
  assert.equal(getRouteAllowedRoles("/audit-log")?.includes("yonetim"), true);
  assert.equal(getRouteAllowedRoles("/talebeler/yeni")?.includes("yonetim"), false);
  assert.equal(getRouteAllowedRoles("/kullanicilar/yeni")?.includes("yonetim"), false);

  assert.equal(canViewStudent(yonetim, { department_id: "dep-1" }), true);
  assert.equal(canCreateStudent(yonetim), false);
  assert.equal(canCreateTalep(yonetim), false);
  assert.equal(canManageAcademicTerms(yonetim), false);
  assert.equal(canManageAttendance(yonetim), false);
  assert.equal(await canManageGuidance(yonetim), false);
  assert.equal(canViewGuidance(yonetim), true);
  assert.equal(canEditStudentGrades(yonetim, { status: "active" }, { department_id: "dep-1", class_teacher_id: null }, []), false);
  assert.equal(canEditStudentEvaluations(yonetim, { status: "active" }, { department_id: "dep-1", class_teacher_id: null }), false);
  assert.equal(canEditInfirmaryRecord(yonetim, { status: "active" }, { department_id: "dep-1", class_teacher_id: null }), false);
  assert.equal(canEditStudentDocuments(yonetim, { status: "active" }, { department_id: "dep-1", class_teacher_id: null }), false);
  assert.equal(canBindParentFromStudentDetail(yonetim), false);
});

test("security hardening migration removes broad academic policies", () => {
  assert.match(rlsMigration, /drop policy if exists "authenticated can manage academic_terms"/);
  assert.match(rlsMigration, /drop policy if exists "authenticated can manage grades"/);
  assert.match(rlsMigration, /drop policy if exists "authenticated can manage student_evaluations"/);
  assert.match(rlsMigration, /drop policy if exists "authenticated can manage exam_types"/);
});

test("security hardening migration enables RLS for sensitive term and archive tables", () => {
  assert.match(rlsMigration, /alter table public\.student_term_snapshots enable row level security/);
  assert.match(rlsMigration, /alter table public\.archive_exports enable row level security/);
  assert.match(rlsMigration, /create policy "student_term_snapshots_select_scoped_staff"/);
  assert.match(rlsMigration, /create policy "archive_exports_select_top_managers"/);
});

test("archives bucket has no authenticated direct select policy", () => {
  assert.match(rlsMigration, /update storage\.buckets\s+set public = false\s+where id = 'archives'/);
  assert.doesNotMatch(rlsMigration, /create policy "archives_objects_select"/);
  assert.match(rlsMigration, /create policy "archives_objects_insert"/);
});

test("hafizlik visibility migration lets teachers read department-wide records", () => {
  assert.match(hafizlikVisibilityMigration, /create policy "Hoca gorebilir bolumundeki hafizlik kayitlari"/);
  assert.match(hafizlikVisibilityMigration, /for select/);
  assert.match(hafizlikVisibilityMigration, /p\.role = 'hoca'/);
  assert.match(hafizlikVisibilityMigration, /p\.department_id = c\.department_id/);
});
