"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { z } from "zod";

import { buildAuditActor, createAuditLog } from "@/lib/audit/log";
import { generateArchiveExportPayload } from "@/lib/archives/export-service";
import { assertCanManageArchives } from "@/lib/archives/permissions";
import { requireAuth } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ArchiveExportRow } from "@/types/database";

const exportSchema = z.object({
  export_type: z.enum(["student_pdf", "term_csv", "department_csv", "class_csv"]),
  scope_id: z.string().uuid("Export kapsamı seçilmelidir."),
  term_id: z.string().uuid().optional().or(z.literal("")),
});

export async function createArchiveExportAction(formData: FormData) {
  const { profile } = await requireAuth();
  assertCanManageArchives(profile);

  const parsed = exportSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(`/sistem/arsiv-merkezi?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Form hatalı.")}`);
  }

  const selectedTermId = parsed.data.term_id || (parsed.data.export_type === "term_csv" ? parsed.data.scope_id : null);
  const admin = createSupabaseAdminClient();
  const { data: exportRow, error: insertError } = await admin
    .from("archive_exports")
    .insert({
      export_type: parsed.data.export_type,
      status: "pending",
      created_by: profile.id,
      term_id: selectedTermId,
      scope_id: parsed.data.scope_id,
    })
    .select("*")
    .single();

  if (insertError || !exportRow) {
    redirect("/sistem/arsiv-merkezi?error=export-create");
  }

  await admin.from("archive_exports").update({ status: "processing" }).eq("id", exportRow.id);

  try {
    const payload = await generateArchiveExportPayload(parsed.data.export_type, parsed.data.scope_id, selectedTermId);
    const storagePath = `archives/${exportRow.id}/${payload.fileName}`;
    const uploadResult = await admin.storage.from("archives").upload(storagePath, payload.bytes, {
      contentType: payload.contentType,
      upsert: false,
    });

    if (uploadResult.error) {
      throw new Error(uploadResult.error.message);
    }

    await admin
      .from("archive_exports")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        file_name: payload.fileName,
        file_size: payload.bytes.length,
        storage_bucket: "archives",
        storage_path: storagePath,
        content_type: payload.contentType,
        term_id: payload.termId,
        scope_type: payload.scopeType,
        scope_id: payload.scopeId,
        metadata: payload.metadata,
        error_message: null,
      })
      .eq("id", exportRow.id);

    await createAuditLog({
      ...buildAuditActor(profile),
      action: "archive_export_created",
      entityType: "archive_export",
      entityId: exportRow.id,
      title: "Arşiv export oluşturuldu",
      description: `${payload.fileName} dosyası oluşturuldu.`,
      afterData: {
        export_type: parsed.data.export_type,
        file_name: payload.fileName,
        file_size: payload.bytes.length,
      },
    });

    revalidatePath("/sistem/arsiv-merkezi");
    redirect("/sistem/arsiv-merkezi?success=export-created");
  } catch (error) {
    unstable_rethrow(error);
    const message = error instanceof Error ? error.message : "Export oluşturulamadı.";
    await markExportFailed(exportRow.id, message);
    await createAuditLog({
      ...buildAuditActor(profile),
      action: "archive_export_failed",
      entityType: "archive_export",
      entityId: exportRow.id,
      title: "Arşiv export başarısız",
      description: message,
      afterData: {
        export_type: parsed.data.export_type,
        error_message: message,
      },
    });
    revalidatePath("/sistem/arsiv-merkezi");
    redirect(`/sistem/arsiv-merkezi?error=${encodeURIComponent(message)}`);
  }
}

export async function downloadArchiveExportAction(formData: FormData) {
  const { profile } = await requireAuth();
  assertCanManageArchives(profile);

  const exportId = String(formData.get("export_id") ?? "");
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.from("archive_exports").select("*").eq("id", exportId).maybeSingle();

  if (error || !data) {
    redirect("/sistem/arsiv-merkezi?error=export-not-found");
  }

  const exportRow = data as ArchiveExportRow;
  if (exportRow.status !== "completed" || !exportRow.storage_path) {
    redirect("/sistem/arsiv-merkezi?error=export-not-ready");
  }

  const { data: signedUrl, error: signedUrlError } = await admin.storage.from(exportRow.storage_bucket).createSignedUrl(exportRow.storage_path, 60);
  if (signedUrlError || !signedUrl?.signedUrl) {
    redirect("/sistem/arsiv-merkezi?error=download");
  }

  await createAuditLog({
    ...buildAuditActor(profile),
    action: "archive_export_downloaded",
    entityType: "archive_export",
    entityId: exportRow.id,
    title: "Arşiv export indirildi",
    description: exportRow.file_name,
    metadata: {
      export_type: exportRow.export_type,
      file_name: exportRow.file_name,
    },
  });

  redirect(signedUrl.signedUrl);
}

async function markExportFailed(exportId: string, message: string) {
  const admin = createSupabaseAdminClient();
  await admin
    .from("archive_exports")
    .update({
      status: "failed",
      completed_at: new Date().toISOString(),
      error_message: message,
    })
    .eq("id", exportId);
}
