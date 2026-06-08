import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ProfileRow } from "@/types/database";

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export type AuditLogInput = {
  actorProfileId?: string | null;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  studentId?: string | null;
  title: string;
  description?: string | null;
  beforeData?: JsonValue | null;
  afterData?: JsonValue | null;
  metadata?: JsonValue | null;
};

type StudentAuditLogInput = Omit<AuditLogInput, "entityType" | "entityId" | "studentId"> & {
  studentId: string;
  entityType?: string;
  entityId?: string | null;
};

export async function createAuditLog(input: AuditLogInput) {
  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("audit_logs").insert({
      actor_profile_id: input.actorProfileId ?? null,
      actor_name: input.actorName,
      actor_role: input.actorRole,
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId ?? null,
      student_id: input.studentId ?? null,
      title: input.title,
      description: input.description ?? null,
      before_data: input.beforeData ?? null,
      after_data: input.afterData ?? null,
      metadata: input.metadata ?? null,
    });

    if (error) {
      warnAuditFailure("[audit-log] insert failed", error, input);
    }
  } catch (error) {
    warnAuditFailure("[audit-log] unexpected error", error, input);
  }
}

export async function createStudentAuditLog(input: StudentAuditLogInput) {
  return createAuditLog({
    ...input,
    entityType: input.entityType ?? "student",
    entityId: input.entityId ?? input.studentId,
    studentId: input.studentId,
  });
}

export function buildAuditActor(profile: ProfileRow) {
  return {
    actorProfileId: profile.id,
    actorName: profile.full_name,
    actorRole: profile.role,
  };
}

function warnAuditFailure(message: string, error: unknown, input: AuditLogInput) {
  console.warn(message, {
    ...(isSupabaseError(error)
      ? {
          code: error.code ?? null,
          message: error.message ?? null,
          details: error.details ?? null,
          hint: error.hint ?? null,
        }
      : {
          error: safeErrorValue(error),
        }),
    input,
  });
}

function isSupabaseError(error: unknown): error is { code?: string | null; message?: string | null; details?: string | null; hint?: string | null } {
  return typeof error === "object" && error !== null;
}

function safeErrorValue(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
    };
  }

  if (error === null || error === undefined) {
    return null;
  }

  return error;
}
