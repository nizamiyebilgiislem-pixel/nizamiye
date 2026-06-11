import test from "node:test";
import assert from "node:assert/strict";

import { auditActionLabels, auditEntityTypeLabels } from "../src/lib/audit/constants";
import { canManageAcademicTerms } from "../src/lib/terms/management-permissions";
import { validateCreateAcademicTermInput } from "../src/lib/terms/management-validation";
import { getRouteAllowedRoles } from "../src/lib/route-permissions";
import type { ProfileRole } from "../src/types/rbac";

function profile(role: ProfileRole) {
  return { role };
}

test("admin ve genel müdür dönem yönetebilir", () => {
  assert.equal(canManageAcademicTerms(profile("admin")), true);
  assert.equal(canManageAcademicTerms(profile("genel_mudur")), true);
});

test("diğer roller dönem yönetemez", () => {
  const deniedRoles: ProfileRole[] = [
    "bolum_muduru",
    "kutuphane_gorevlisi",
    "hoca",
    "veli",
    "rehberlik",
    "destek_birim_muduru",
    "muhasebe",
  ];

  for (const role of deniedRoles) {
    assert.equal(canManageAcademicTerms(profile(role)), false);
  }
});

test("dönem oluşturma validasyonu boş adı reddeder", () => {
  const result = validateCreateAcademicTermInput({
    name: "",
    start_date: "2027-09-01",
    end_date: "2028-06-30",
  });

  assert.equal(result.success, false);
});

test("dönem oluşturma validasyonu tarih sırasını kontrol eder", () => {
  const result = validateCreateAcademicTermInput({
    name: "2027-2028",
    start_date: "2028-06-30",
    end_date: "2027-09-01",
  });

  assert.equal(result.success, false);
});

test("dönem oluşturma validasyonu geçerli formu kabul eder", () => {
  const result = validateCreateAcademicTermInput({
    name: "2027-2028",
    start_date: "2027-09-01",
    end_date: "2028-06-30",
  });

  assert.equal(result.success, true);
});

test("dönem yönetimi route'ları sadece üst yönetime açıktır", () => {
  assert.deepEqual(getRouteAllowedRoles("/sistem/donem-yonetimi"), ["admin", "genel_mudur"]);
  assert.deepEqual(getRouteAllowedRoles("/sistem/donem-yonetimi/ae609c0e-6bc2-4400-a3da-07df4efcbf8d"), ["admin", "genel_mudur"]);
});

test("dönem audit kayıtları etiketlidir", () => {
  assert.equal(auditActionLabels.term_created, "Dönem oluşturuldu");
  assert.equal(auditActionLabels.term_activated, "Dönem aktif edildi");
  assert.equal(auditActionLabels.term_viewed, "Dönem görüntülendi");
  assert.equal(auditEntityTypeLabels.academic_term, "Akademik Dönem");
});
