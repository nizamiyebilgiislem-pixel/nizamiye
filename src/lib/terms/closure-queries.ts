import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AcademicTermRow, ProfileRow, TermClosureRunRow } from "@/types/database";

export type TermClosureRunHistoryItem = TermClosureRunRow & {
  term: Pick<AcademicTermRow, "id" | "name"> | null;
  startedByProfile: Pick<ProfileRow, "id" | "full_name"> | null;
};

export async function getTermClosureRunHistory(limit = 10): Promise<TermClosureRunHistoryItem[]> {
  const admin = createSupabaseAdminClient();
  const { data: runs, error } = await admin
    .from("term_closure_runs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error("Dönem kapanış geçmişi alınamadı.");
  }

  const rows = (runs ?? []) as TermClosureRunRow[];
  if (rows.length === 0) {
    return [];
  }

  const termIds = Array.from(new Set(rows.map((run) => run.term_id)));
  const profileIds = Array.from(new Set(rows.map((run) => run.started_by).filter(Boolean))) as string[];

  const [{ data: terms, error: termsError }, { data: profiles, error: profilesError }] = await Promise.all([
    admin.from("academic_terms").select("id,name").in("id", termIds),
    profileIds.length > 0
      ? admin.from("profiles").select("id,full_name").in("id", profileIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (termsError) {
    throw new Error("Dönem kapanış geçmişi dönem bilgileri alınamadı.");
  }

  if (profilesError) {
    throw new Error("Dönem kapanış geçmişi kullanıcı bilgileri alınamadı.");
  }

  const termMap = new Map((terms ?? []).map((term) => [term.id, term]));
  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  return rows.map((run) => ({
    ...run,
    term: termMap.get(run.term_id) ?? null,
    startedByProfile: run.started_by ? profileMap.get(run.started_by) ?? null : null,
  }));
}
