"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { buildAuditActor, createAuditLog } from "@/lib/audit/log";
import { requireAuth } from "@/lib/auth";
import { canManageGradeSettings } from "@/lib/grades/permissions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AcademicTermStatus } from "@/types/database";
import { buildStudentTermSnapshots } from "@/lib/terms/snapshots";
import { getAcademicTermById } from "@/lib/terms/queries";

const emptyDateToNull = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  return value.trim() === "" ? null : value;
}, z.string().nullable());

const statusSchema = z.enum(["draft", "active", "closed", "archived"]);
const booleanField = z.preprocess((value) => value === "on" || value === "true", z.boolean());

const termSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2, "Dönem adı zorunludur."),
  start_date: emptyDateToNull,
  end_date: emptyDateToNull,
  status: statusSchema.default("draft"),
  is_current: booleanField.default(false),
});

export async function upsertTermAction(formData: FormData) {
  const { profile } = await requireAuth();

  if (!canManageGradeSettings(profile)) {
    redirect("/not-sistemi/donemler?error=unauthorized");
  }

  const parsed = termSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirect(`/not-sistemi/donemler?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Form hatalı.")}`);
  }

  const admin = createSupabaseAdminClient();
  const normalizedStatus: AcademicTermStatus = parsed.data.is_current ? "active" : parsed.data.status;
  const payload = {
    name: parsed.data.name,
    start_date: parsed.data.start_date,
    end_date: parsed.data.end_date,
    status: normalizedStatus,
    closed_at: normalizedStatus === "closed" || normalizedStatus === "archived" ? new Date().toISOString() : null,
    closed_by: normalizedStatus === "closed" || normalizedStatus === "archived" ? profile.id : null,
    is_current: parsed.data.is_current && normalizedStatus === "active",
    is_active: normalizedStatus === "active",
  };

  if (payload.is_current) {
    await admin.from("academic_terms").update({ is_current: false }).eq("is_current", true);
  }

  const result = parsed.data.id
    ? await admin.from("academic_terms").update(payload).eq("id", parsed.data.id).select("id").single()
    : await admin.from("academic_terms").insert(payload).select("id").single();

  if (result.error || !result.data) {
    redirect("/not-sistemi/donemler?error=save");
  }

  if (payload.is_current) {
    await admin.from("academic_terms").update({ is_current: true, status: "active", is_active: true }).eq("id", result.data.id);
  }

  await createAuditLog({
    ...buildAuditActor(profile),
    action: "term_updated",
    title: "Dönem kaydedildi",
    description: `${parsed.data.name} dönemi kaydedildi.`,
    entityType: "academic_term",
    entityId: result.data.id,
    beforeData: parsed.data.id ? { id: parsed.data.id } : null,
    afterData: {
      ...payload,
      id: result.data.id,
    },
  });

  revalidatePath("/not-sistemi/donemler");
  revalidatePath("/not-sistemi/not-girisi");
  revalidatePath("/kanaat-sistemi/kanaat-girisi");
  revalidatePath("/dashboard");
  redirect("/not-sistemi/donemler?saved=1");
}

export async function setCurrentTermAction(formData: FormData) {
  const { profile } = await requireAuth();

  if (!canManageGradeSettings(profile)) {
    redirect("/not-sistemi/donemler?error=unauthorized");
  }

  const id = String(formData.get("id") ?? "");
  const parsed = z.string().uuid().safeParse(id);

  if (!parsed.success) {
    redirect("/not-sistemi/donemler?error=not-found");
  }

  const term = await getAcademicTermById(parsed.data);

  if (!term) {
    redirect("/not-sistemi/donemler?error=not-found");
  }

  if (term.status === "closed" || term.status === "archived") {
    redirect(`/not-sistemi/donemler/${term.id}?error=term-locked`);
  }

  const admin = createSupabaseAdminClient();
  await admin.from("academic_terms").update({ is_current: false }).eq("is_current", true);

  const { error } = await admin
    .from("academic_terms")
    .update({
      is_current: true,
      status: "active",
      is_active: true,
      closed_at: null,
      closed_by: null,
    })
    .eq("id", term.id);

  if (error) {
    redirect(`/not-sistemi/donemler/${term.id}?error=save`);
  }

  await createAuditLog({
    ...buildAuditActor(profile),
    action: "term_updated",
    title: "Dönem aktif yapıldı",
    description: `${term.name} dönemi aktif dönem olarak seçildi.`,
    entityType: "academic_term",
    entityId: term.id,
    beforeData: { is_current: term.is_current, status: term.status },
    afterData: { is_current: true, status: "active" },
  });

  revalidatePath("/not-sistemi/donemler");
  revalidatePath("/not-sistemi/not-girisi");
  revalidatePath("/kanaat-sistemi/kanaat-girisi");
  revalidatePath("/dashboard");
  redirect(`/not-sistemi/donemler/${term.id}?success=current-set`);
}

export async function closeTermAction(formData: FormData) {
  const { profile } = await requireAuth();

  if (!canManageGradeSettings(profile)) {
    redirect("/not-sistemi/donemler?error=unauthorized");
  }

  const id = String(formData.get("id") ?? "");
  const parsed = z.string().uuid().safeParse(id);

  if (!parsed.success) {
    redirect("/not-sistemi/donemler?error=not-found");
  }

  const term = await getAcademicTermById(parsed.data);

  if (!term) {
    redirect("/not-sistemi/donemler?error=not-found");
  }

  const admin = createSupabaseAdminClient();
  const snapshotResult = await buildStudentTermSnapshots(term, profile);
  const closedAt = term.closed_at ?? new Date().toISOString();

  const { error } = await admin
    .from("academic_terms")
    .update({
      status: "closed",
      closed_at: closedAt,
      closed_by: term.closed_by ?? profile.id,
      is_current: false,
      is_active: false,
    })
    .eq("id", term.id);

  if (error) {
    redirect(`/not-sistemi/donemler/${term.id}/kapat?error=save`);
  }

  await createAuditLog({
    ...buildAuditActor(profile),
    action: "term_closed",
    title: "Dönem kapatıldı",
    description: `${term.name} dönemi kapatıldı ve akademik snapshot'lar oluşturuldu.`,
    entityType: "academic_term",
    entityId: term.id,
    beforeData: {
      status: term.status,
      is_current: term.is_current,
    },
    afterData: {
      status: "closed",
      is_current: false,
      snapshot_count: snapshotResult.snapshotCount,
    },
    metadata: {
      snapshot_count: snapshotResult.snapshotCount,
      active_student_count: snapshotResult.activeStudentCount,
      grade_count: snapshotResult.gradeCount,
      evaluation_count: snapshotResult.evaluationCount,
    },
  });

  revalidatePath("/not-sistemi/donemler");
  revalidatePath("/not-sistemi/not-girisi");
  revalidatePath("/kanaat-sistemi/kanaat-girisi");
  revalidatePath("/dashboard");
  revalidatePath("/talebeler");
  redirect(`/not-sistemi/donemler/${term.id}?success=closed`);
}
