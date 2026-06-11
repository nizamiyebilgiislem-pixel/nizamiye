import test from "node:test";
import assert from "node:assert/strict";

import { auditActionLabels, auditEntityTypeLabels } from "../src/lib/audit/constants.ts";
import { canManageArchives } from "../src/lib/archives/permissions.ts";
import { createSimplePdf, sanitizeArchiveFilename, toCsv } from "../src/lib/archives/format.ts";
import { getRouteAllowedRoles } from "../src/lib/route-permissions.ts";

test("arsiv merkezi sadece ust yonetime aciktir", () => {
  assert.equal(canManageArchives({ role: "admin" }), true);
  assert.equal(canManageArchives({ role: "genel_mudur" }), true);
  assert.equal(canManageArchives({ role: "bolum_muduru" }), false);
  assert.deepEqual(getRouteAllowedRoles("/sistem/arsiv-merkezi"), ["admin", "genel_mudur"]);
});

test("csv export degerleri guvenli kacirir", () => {
  const csv = toCsv([
    {
      "Öğrenci": "Ali, Veli",
      "Kanaat Özeti": "İyi \"devam\"",
      "Ortalama": 88,
    },
  ]);

  assert.match(csv, /^﻿Öğrenci,Kanaat Özeti,Ortalama/);
  assert.match(csv, /"Ali, Veli"/);
  assert.match(csv, /"İyi ""devam"""/);
});

test("pdf export gecerli pdf imzasi uretir", () => {
  const pdf = createSimplePdf("Talebe Arşivi", ["Dönem: 2026-2027", "Ortalama: 85"]);
  assert.equal(pdf.subarray(0, 8).toString("latin1"), "%PDF-1.4");
  assert.match(pdf.toString("latin1"), /xref/);
});

test("arsiv audit kayitlari etiketlidir", () => {
  assert.equal(auditActionLabels.archive_export_created, "Arşiv export oluşturuldu");
  assert.equal(auditActionLabels.archive_export_downloaded, "Arşiv export indirildi");
  assert.equal(auditActionLabels.archive_export_failed, "Arşiv export başarısız");
  assert.equal(auditEntityTypeLabels.archive_export, "Arşiv Export");
});

test("arsiv dosya adlari normalize edilir", () => {
  assert.equal(sanitizeArchiveFilename("2026-2027 Öğrenci Arşivi.pdf"), "2026-2027-ogrenci-arsivi.pdf");
});
