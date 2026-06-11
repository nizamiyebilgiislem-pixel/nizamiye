"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";

import { buildAuditActor, createAuditLog } from "@/lib/audit/log";
import { requireAuth } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { assertCanManageAcademicTerms, AcademicTermManagementPermissionError } from "@/lib/terms/management-permissions";
import { getAcademicTermManagementDetail, getAcademicTermManagementOverview } from "@/lib/terms/management-queries";
import { validateCreateAcademicTermInput } from "@/lib/terms/management-validation";
import type { AcademicTermStatus } from "@/types/database";

export type CreateAcademicTermActionState =
  | {
      success: true;
      message: string;
      termId: string;
    }
  | {
      success: false;
      error: string;
    };

export async function createAcademicTermAction(
  _previousState: CreateAcademicTermActionState | null,
  formData: FormData,
): Promise<CreateAcademicTermActionState> {
  try {
    const { profile } = await requireAuth();
    assertCanManageAcademicTerms(profile);

    const parsed = validateCreateAcademicTermInput(Object.fromEntries(formData));
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Dönem bilgileri hatalı.",
      };
    }

    const admin = createSupabaseAdminClient();
    const [{ data: activeTerms, error: activeError }, { data: existingTerms, error: existingError }] = await Promise.all([
      admin.from("academic_terms").select("id,name").eq("is_active", true).eq("status", "active").limit(1),
      admin.from("academic_terms").select("id,name").ilike("name", parsed.data.name).limit(1),
    ]);

    if (activeError) {
      return {
        success: false,
        error: "Aktif dönem kontrolü yapılamadı.",
      };
    }

    if ((activeTerms ?? []).length > 0) {
      return {
        success: false,
        error: "Yeni dönem oluşturmadan önce mevcut aktif dönem kapatılmalıdır.",
      };
    }

    if (existingError) {
      return {
        success: false,
        error: "Dönem adı kontrolü yapılamadı.",
      };
    }

    if ((existingTerms ?? []).length > 0) {
      return {
        success: false,
        error: "Aynı isimde dönem oluşturulamaz.",
      };
    }

    const payload = {
      name: parsed.data.name,
      start_date: parsed.data.start_date,
      end_date: parsed.data.end_date,
      status: "active" as AcademicTermStatus,
      closed_at: null,
      closed_by: null,
      is_active: true,
      is_current: true,
    };
    const { data, error } = await admin.from("academic_terms").insert(payload).select("id").single();

    if (error || !data) {
      return {
        success: false,
        error: "Yeni dönem oluşturulamadı.",
      };
    }

    await createAuditLog({
      ...buildAuditActor(profile),
      action: "term_created",
      entityType: "academic_term",
      entityId: data.id,
      title: "Dönem oluşturuldu",
      description: `${parsed.data.name} dönemi oluşturuldu.`,
      afterData: {
        ...payload,
        id: data.id,
      },
    });

    await createAuditLog({
      ...buildAuditActor(profile),
      action: "term_activated",
      entityType: "academic_term",
      entityId: data.id,
      title: "Dönem aktif edildi",
      description: `${parsed.data.name} dönemi aktif ve güncel dönem olarak açıldı.`,
      afterData: {
        id: data.id,
        status: "active",
        is_active: true,
        is_current: true,
      },
    });

    revalidatePath("/sistem/donem-yonetimi");
    revalidatePath("/dashboard");
    revalidatePath("/not-sistemi/donemler");
    revalidatePath("/not-sistemi/not-girisi");
    revalidatePath("/kanaat-sistemi/kanaat-girisi");

    return {
      success: true,
      message: `${parsed.data.name} dönemi oluşturuldu.`,
      termId: data.id,
    };
  } catch (error) {
    unstable_rethrow(error);

    if (error instanceof AcademicTermManagementPermissionError) {
      return {
        success: false,
        error: "Bu işlemi yapma yetkiniz bulunmamaktadır.",
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Yeni dönem oluşturulamadı.",
    };
  }
}

export async function listAcademicTermsAction() {
  const { profile } = await requireAuth();
  assertCanManageAcademicTerms(profile);

  return getAcademicTermManagementOverview();
}

export async function getAcademicTermDetailAction(id: string) {
  const { profile } = await requireAuth();
  assertCanManageAcademicTerms(profile);

  const detail = await getAcademicTermManagementDetail(id);

  if (detail) {
    await createAuditLog({
      ...buildAuditActor(profile),
      action: "term_viewed",
      entityType: "academic_term",
      entityId: detail.id,
      title: "Dönem detayı görüntülendi",
      description: `${detail.name} dönemi görüntülendi.`,
      metadata: {
        termId: detail.id,
        status: detail.status,
      },
    });
  }

  return detail;
}
