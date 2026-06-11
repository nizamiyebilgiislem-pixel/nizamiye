import { getAcademicTermById, getCurrentAcademicTerm } from "@/lib/terms/queries";
import type { AcademicTermRow } from "@/types/database";

export class AcademicTermLockedError extends Error {
  constructor(message = "Seçilen dönem kapalı olduğu için bu işlem yapılamaz.") {
    super(message);
    this.name = "AcademicTermLockedError";
  }
}

export class AcademicTermNotFoundError extends Error {
  constructor(message = "Dönem bulunamadı.") {
    super(message);
    this.name = "AcademicTermNotFoundError";
  }
}

export function assertAcademicTermWritable(term: Pick<AcademicTermRow, "status" | "is_active"> | null | undefined, message?: string) {
  if (!term || term.status !== "active" || !term.is_active) {
    throw new AcademicTermLockedError(message);
  }
}

export async function requireAcademicTermWritable(termId: string) {
  const term = await getAcademicTermById(termId);

  if (!term) {
    throw new AcademicTermNotFoundError();
  }

  assertAcademicTermWritable(term);

  return term;
}

export async function requireCurrentAcademicTermWritable() {
  const term = await getCurrentAcademicTerm();

  if (!term) {
    throw new AcademicTermLockedError("Aktif dönem bulunamadı veya kapalı durumda.");
  }

  assertAcademicTermWritable(term);

  return term;
}

export function assertDateWithinAcademicTerm(dateValue: string, term: Pick<AcademicTermRow, "start_date" | "end_date" | "status" | "is_active">, message?: string) {
  assertAcademicTermWritable(term, message);

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    throw new AcademicTermLockedError(message ?? "Geçersiz tarih.");
  }

  const day = date.toISOString().slice(0, 10);
  if (term.start_date && day < term.start_date) {
    throw new AcademicTermLockedError(message ?? "Kayıt tarihi aktif dönem dışında.");
  }

  if (term.end_date && day > term.end_date) {
    throw new AcademicTermLockedError(message ?? "Kayıt tarihi aktif dönem dışında.");
  }
}
