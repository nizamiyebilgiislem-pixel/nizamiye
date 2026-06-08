import { createAuditLog } from "@/lib/audit/log";
import type { ProfileRow } from "@/types/database";

type PdfGenerationInput = {
  reportType: string;
  entityType: string;
  entityId?: string | null;
  studentId?: string | null;
  title: string;
  description?: string | null;
};

export async function logPdfGenerated(profile: ProfileRow, input: PdfGenerationInput) {
  try {
    await createAuditLog({
      actorProfileId: profile.id,
      actorName: profile.full_name,
      actorRole: profile.role,
      action: "pdf_generated",
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      studentId: input.studentId ?? null,
      title: input.title,
      description: input.description ?? null,
      metadata: {
        report_type: input.reportType,
        entity_id: input.entityId ?? input.studentId ?? null,
      },
    });
  } catch (error) {
    console.warn("[audit-log] pdf generation log failed", {
      error: error instanceof Error ? { name: error.name, message: error.message } : error ?? null,
      input,
    });
  }
}
