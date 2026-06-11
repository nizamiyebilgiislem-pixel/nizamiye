import type { ProfileRow } from "@/types/database";

export function canManageTermClosure(profile: Pick<ProfileRow, "role">) {
  return profile.role === "admin" || profile.role === "genel_mudur";
}

export function assertCanManageTermClosure(profile: Pick<ProfileRow, "role">) {
  if (!canManageTermClosure(profile)) {
    throw new TermClosurePermissionError();
  }
}

export class TermClosurePermissionError extends Error {
  constructor() {
    super("Dönem sonlandırma yetkisi bulunmamaktadır.");
    this.name = "TermClosurePermissionError";
  }
}
