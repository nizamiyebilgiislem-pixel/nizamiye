import { buildAuditActor, createAuditLog } from "@/lib/audit/log";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { buildStudentTermSnapshots } from "@/lib/terms/snapshots";
import { assertCanManageTermClosure } from "@/lib/terms/closure-permissions";
import { simulateTermClosure } from "@/lib/terms/simulation";
import type { AcademicTermRow, JsonValue, ProfileRow, TermClosureRunRow, TermSimulationResult } from "@/types/database";

export type RunTermClosureResult = {
  run: TermClosureRunRow;
  simulation: TermSimulationResult;
  snapshotCount: number;
};

export class TermClosureAlreadyRunningError extends Error {
  constructor() {
    super("Bu dönem için devam eden bir dönem sonlandırma işlemi var.");
    this.name = "TermClosureAlreadyRunningError";
  }
}

export class TermClosureValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TermClosureValidationError";
  }
}

export async function runTermClosure(termId: string, profile: ProfileRow): Promise<RunTermClosureResult> {
  assertCanManageTermClosure(profile);

  const admin = createSupabaseAdminClient();
  const term = await getTermForClosure(termId);
  validateTermForClosure(term);
  await assertNoActiveClosureRun(term.id);

  const simulation = await simulateTermClosure(term, profile);
  const run = await createRunningRunRecord(admin, term, profile, simulation);

  if (simulation.blockers.length > 0) {
    const blockerMessage = simulation.blockers.join(" ");
    await markRunFailed(admin, run.id, blockerMessage, simulation);
    await createAuditLog({
      ...buildAuditActor(profile),
      action: "term_closure_failed",
      entityType: "term_closure_run",
      entityId: run.id,
      title: "Dönem sonlandırma engellendi",
      description: `${term.name} dönemi için dönem sonlandırma engeli bulundu.`,
      metadata: {
        termId: term.id,
        blockers: simulation.blockers,
      },
    });
    throw new TermClosureValidationError(blockerMessage);
  }

  try {
    const snapshotResult = await buildStudentTermSnapshots(term, profile);

    await createAuditLog({
      ...buildAuditActor(profile),
      action: "term_snapshot_created",
      entityType: "academic_term",
      entityId: term.id,
      title: "Dönem snapshot'ı oluşturuldu",
      description: `${term.name} dönemi için ${snapshotResult.snapshotCount} snapshot kaydı oluşturuldu.`,
      metadata: {
        termId: term.id,
        snapshotCount: snapshotResult.snapshotCount,
        activeStudentCount: snapshotResult.activeStudentCount,
        gradeCount: snapshotResult.gradeCount,
        evaluationCount: snapshotResult.evaluationCount,
        infirmaryCount: snapshotResult.infirmaryCount,
      },
    });

    const completedRun = await completeTermClosureInDatabase(admin, {
      term,
      runId: run.id,
      profileId: profile.id,
      simulation,
      snapshotCount: snapshotResult.snapshotCount,
      activeStudentCount: snapshotResult.activeStudentCount,
      gradeCount: snapshotResult.gradeCount,
      evaluationCount: snapshotResult.evaluationCount,
      infirmaryCount: snapshotResult.infirmaryCount,
    });

    await createAuditLog({
      ...buildAuditActor(profile),
      action: "term_closed",
      entityType: "academic_term",
      entityId: term.id,
      title: "Dönem kapatıldı",
      description: `${term.name} dönemi kapatıldı ve salt okunur hale getirildi.`,
      metadata: {
        termId: term.id,
        runId: completedRun.id,
      },
    });

    await createAuditLog({
      ...buildAuditActor(profile),
      action: "term_closure_completed",
      entityType: "term_closure_run",
      entityId: completedRun.id,
      title: "Dönem sonlandırma tamamlandı",
      description: `${term.name} dönemi için dönem sonlandırma tamamlandı.`,
      metadata: {
        termId: term.id,
        runId: completedRun.id,
        snapshotCount: snapshotResult.snapshotCount,
      },
    });

    return {
      run: completedRun,
      simulation,
      snapshotCount: snapshotResult.snapshotCount,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Bilinmeyen hata";
    await markRunFailed(admin, run.id, errorMessage, simulation);
    await createAuditLog({
      ...buildAuditActor(profile),
      action: "term_closure_failed",
      entityType: "term_closure_run",
      entityId: run.id,
      title: "Dönem sonlandırma başarısız oldu",
      description: `${term.name} dönemi için dönem sonlandırma başarısız oldu.`,
      metadata: {
        termId: term.id,
        message: errorMessage,
      },
    });
    throw error;
  }
}

export async function getActiveClosureRun(termId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("term_closure_runs")
    .select("*")
    .eq("term_id", termId)
    .in("status", ["pending", "running"])
    .maybeSingle();

  if (error) {
    throw new Error("Dönem sonlandırma işlem durumu alınamadı.");
  }

  return data as TermClosureRunRow | null;
}

async function assertNoActiveClosureRun(termId: string) {
  const activeRun = await getActiveClosureRun(termId);
  if (activeRun) {
    throw new TermClosureAlreadyRunningError();
  }
}

async function getTermForClosure(termId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.from("academic_terms").select("*").eq("id", termId).maybeSingle();

  if (error) {
    throw new Error("Dönem bilgisi alınamadı.");
  }

  if (!data) {
    throw new TermClosureValidationError("Dönem bulunamadı.");
  }

  return data as AcademicTermRow;
}

function validateTermForClosure(term: AcademicTermRow) {
  if (term.status === "closed" || term.status === "archived") {
    throw new TermClosureValidationError("Kapalı veya arşivlenmiş dönem için dönem sonlandırma başlatılamaz.");
  }
}

async function createRunningRunRecord(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  term: AcademicTermRow,
  profile: ProfileRow,
  simulation: TermSimulationResult,
) {
  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("term_closure_runs")
    .insert({
      term_id: term.id,
      status: "pending",
      started_at: now,
      started_by: profile.id,
      simulation_result: simulation as unknown as JsonValue,
      summary_json: buildClosureSummaryJson(simulation),
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Dönem sonlandırma operasyon kaydı oluşturulamadı.");
  }

  const { data: runningRun, error: runningError } = await admin
    .from("term_closure_runs")
    .update({ status: "running" })
    .eq("id", data.id)
    .select("*")
    .single();

  if (runningError || !runningRun) {
    await markRunFailed(admin, data.id, runningError?.message ?? "Dönem sonlandırma operasyonu başlatılamadı.", simulation);
    throw new Error(runningError?.message ?? "Dönem sonlandırma operasyonu başlatılamadı.");
  }

  return runningRun as TermClosureRunRow;
}

async function completeTermClosureInDatabase(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  input: {
    term: AcademicTermRow;
    runId: string;
    profileId: string;
    simulation: TermSimulationResult;
    snapshotCount: number;
    activeStudentCount: number;
    gradeCount: number;
    evaluationCount: number;
    infirmaryCount: number;
  },
) {
  const rpcClient = admin as unknown as {
    rpc: (
      fn: string,
      params: Record<string, unknown>,
    ) => Promise<{ data: unknown; error: { message?: string } | null }>;
  };

  const { data, error } = await rpcClient.rpc("complete_term_closure", {
    p_term_id: input.term.id,
    p_run_id: input.runId,
    p_profile_id: input.profileId,
    p_summary: {
      snapshotCount: input.snapshotCount,
      activeStudentCount: input.activeStudentCount,
      gradeCount: input.gradeCount,
      evaluationCount: input.evaluationCount,
      infirmaryCount: input.infirmaryCount,
    },
    p_simulation_result: input.simulation as unknown as JsonValue,
  });

  if (error || !data) {
    throw new Error(error?.message ?? "Dönem kapatma işlemi tamamlanamadı.");
  }

  return data as TermClosureRunRow;
}

async function markRunFailed(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  runId: string,
  errorMessage: string,
  simulation: TermSimulationResult,
) {
  const { error } = await admin
    .from("term_closure_runs")
    .update({
      status: "failed",
      failed_at: new Date().toISOString(),
      error_message: errorMessage,
      simulation_result: simulation as unknown as JsonValue,
      summary_json: buildClosureSummaryJson(simulation),
    })
    .eq("id", runId);

  if (error) {
    console.warn("[term-closure] failed run update error", {
      message: error.message,
      code: error.code ?? null,
    });
  }
}

function buildClosureSummaryJson(simulation: TermSimulationResult) {
  return {
    activeStudentCount: simulation.activeStudentCount,
    departmentCount: simulation.departmentCount,
    classCount: simulation.classCount,
    gradeCount: simulation.gradeCount,
    evaluationCount: simulation.evaluationCount,
    attendanceSessionCount: simulation.attendanceSessionCount,
    attendanceRecordCount: simulation.attendanceRecordCount,
    infirmaryRecordCount: simulation.infirmaryRecordCount,
    guidanceRecordCount: simulation.guidanceRecordCount,
    activeDormitoryAssignmentCount: simulation.activeDormitoryAssignmentCount,
    openTaskCount: simulation.openTaskCount,
    openTalepCount: simulation.openTalepCount,
    openLibraryLoanCount: simulation.openLibraryLoanCount,
    plannedLiveSessionCount: simulation.plannedLiveSessionCount,
    warningCount: simulation.warnings.length,
    blockerCount: simulation.blockers.length,
  };
}
