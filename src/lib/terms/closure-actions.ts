"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";

import { requireAuth } from "@/lib/auth";
import { assertCanManageTermClosure, TermClosurePermissionError } from "@/lib/terms/closure-permissions";
import { runTermClosure } from "@/lib/terms/closure";
import { getCurrentAcademicTerm } from "@/lib/terms/queries";
import { simulateTermClosure } from "@/lib/terms/simulation";
import type { TermSimulationResult } from "@/types/database";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type TermClosureSimulationActionResult =
  | {
      success: true;
      result: TermSimulationResult;
    }
  | {
      success: false;
      error: string;
    };

export async function runTermClosureSimulationAction(): Promise<TermClosureSimulationActionResult> {
  try {
    const { profile } = await requireAuth();
    assertCanManageTermClosure(profile);

    const activeTerm = await getCurrentAcademicTerm();
    if (!activeTerm) {
      return {
        success: false,
        error: "Sonlandırılabilecek aktif dönem bulunamadı.",
      };
    }

    const result = await simulateTermClosure(activeTerm, profile);

    return {
      success: true,
      result,
    };
  } catch (error) {
    unstable_rethrow(error);

    if (error instanceof TermClosurePermissionError) {
      return {
        success: false,
        error: "Bu ekranı kullanma yetkiniz bulunmamaktadır.",
      };
    }

    console.error("[term-closure-simulation] failed", {
      message: error instanceof Error ? error.message : "Bilinmeyen hata",
    });

    return {
      success: false,
      error: "Dönem sonlandırma simülasyonu çalıştırılamadı.",
    };
  }
}

export type TermClosureActionState =
  | {
      success: true;
      message: string;
    }
  | {
      success: false;
      error: string;
    };

export async function runTermClosureAction(_previousState: TermClosureActionState | null, formData: FormData): Promise<TermClosureActionState> {
  try {
    const { profile } = await requireAuth();
    assertCanManageTermClosure(profile);

    const termId = String(formData.get("term_id") ?? "").trim();
    const confirmationText = String(formData.get("confirmation_text") ?? "").trim();
    const isConfirmed = String(formData.get("confirmation_ack") ?? "") === "on";

    if (!termId) {
      return {
        success: false,
        error: "Dönem bilgisi bulunamadı.",
      };
    }

    if (!UUID_PATTERN.test(termId)) {
      return {
        success: false,
        error: "Geçersiz dönem bilgisi. Lütfen sayfayı yenileyip tekrar deneyin.",
      };
    }

    const activeTerm = await getCurrentAcademicTerm();
    if (!activeTerm) {
      return {
        success: false,
        error: "Sonlandırılabilecek aktif dönem bulunamadı.",
      };
    }

    if (termId !== activeTerm.id) {
      return {
        success: false,
        error: "Seçilen dönem aktif dönemle eşleşmiyor. Lütfen sayfayı yenileyip tekrar deneyin.",
      };
    }

    if (!isConfirmed) {
      return {
        success: false,
        error: "Onay kutusu işaretlenmelidir.",
      };
    }

    if (confirmationText !== "DÖNEMİ KAPAT") {
      return {
        success: false,
        error: 'İşlemi başlatmak için "DÖNEMİ KAPAT" yazılmalıdır.',
      };
    }

    const result = await runTermClosure(activeTerm.id, profile);

    revalidatePath("/sistem/donem-sonlandirma");
    revalidatePath("/dashboard");
    revalidatePath("/not-sistemi/donemler");
    revalidatePath("/raporlar/donem-sonu");
    revalidatePath("/talebeler");

    return {
      success: true,
      message: `Dönem kapatıldı. ${result.snapshotCount} snapshot oluşturuldu.`,
    };
  } catch (error) {
    unstable_rethrow(error);

    if (error instanceof TermClosurePermissionError) {
      return {
        success: false,
        error: "Bu ekranı kullanma yetkiniz bulunmamaktadır.",
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Dönem kapatma işlemi tamamlanamadı.",
    };
  }
}
