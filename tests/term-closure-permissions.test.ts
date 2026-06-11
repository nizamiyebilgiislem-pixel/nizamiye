import test from "node:test";
import assert from "node:assert/strict";

import {
  TermClosurePermissionError,
  assertCanManageTermClosure,
  canManageTermClosure,
} from "../src/lib/terms/closure-permissions";
import type { ProfileRole } from "../src/types/rbac";

function profile(role: ProfileRole) {
  return { role };
}

test("admin dönem sonlandırma altyapısını yönetebilir", () => {
  assert.equal(canManageTermClosure(profile("admin")), true);
  assert.doesNotThrow(() => assertCanManageTermClosure(profile("admin")));
});

test("genel müdür dönem sonlandırma altyapısını yönetebilir", () => {
  assert.equal(canManageTermClosure(profile("genel_mudur")), true);
  assert.doesNotThrow(() => assertCanManageTermClosure(profile("genel_mudur")));
});

test("diğer roller dönem sonlandırma altyapısını yönetemez", () => {
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
    assert.equal(canManageTermClosure(profile(role)), false);
    assert.throws(() => assertCanManageTermClosure(profile(role)), TermClosurePermissionError);
  }
});
