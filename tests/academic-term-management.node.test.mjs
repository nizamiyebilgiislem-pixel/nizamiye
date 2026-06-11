import test from "node:test";
import assert from "node:assert/strict";

import { auditActionLabels, auditEntityTypeLabels } from "../src/lib/audit/constants.ts";
import { canManageAcademicTerms } from "../src/lib/terms/management-permissions.ts";
import { validateCreateAcademicTermInput } from "../src/lib/terms/management-validation.ts";
import { getRouteAllowedRoles } from "../src/lib/route-permissions.ts";

function profile(role) {
  return { role };
}

test("admin ve genel mudur donem yonetebilir", () => {
  assert.equal(canManageAcademicTerms(profile("admin")), true);
  assert.equal(canManageAcademicTerms(profile("genel_mudur")), true);
});

test("diger roller donem yonetemez", () => {
  const deniedRoles = [
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

test("donem olusturma validasyonu bos adi reddeder", () => {
  const result = validateCreateAcademicTermInput({
    name: "",
    start_date: "2027-09-01",
    end_date: "2028-06-30",
  });

  assert.equal(result.success, false);
});

test("donem olusturma validasyonu tarih sirasini kontrol eder", () => {
  const result = validateCreateAcademicTermInput({
    name: "2027-2028",
    start_date: "2028-06-30",
    end_date: "2027-09-01",
  });

  assert.equal(result.success, false);
});

test("donem olusturma validasyonu gecerli formu kabul eder", () => {
  const result = validateCreateAcademicTermInput({
    name: "2027-2028",
    start_date: "2027-09-01",
    end_date: "2028-06-30",
  });

  assert.equal(result.success, true);
});

test("donem yonetimi routelari sadece ust yonetime aciktir", () => {
  assert.deepEqual(getRouteAllowedRoles("/sistem/donem-yonetimi"), ["admin", "genel_mudur"]);
  assert.deepEqual(getRouteAllowedRoles("/sistem/donem-yonetimi/ae609c0e-6bc2-4400-a3da-07df4efcbf8d"), ["admin", "genel_mudur"]);
});

test("donem audit kayitlari etiketlidir", () => {
  assert.equal(auditActionLabels.term_created, "Dönem oluşturuldu");
  assert.equal(auditActionLabels.term_activated, "Dönem aktif edildi");
  assert.equal(auditActionLabels.term_viewed, "Dönem görüntülendi");
  assert.equal(auditEntityTypeLabels.academic_term, "Akademik Dönem");
});
