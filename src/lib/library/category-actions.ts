"use server";

import { revalidatePath } from "next/cache";

import { requireAuth } from "@/lib/auth";
import { buildAuditActor, createAuditLog } from "@/lib/audit/log";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logSupabaseActionError, buildFriendlyDbErrorMessage } from "@/lib/supabase-action-error";

export async function deleteCategoryAction(categoryId: string) {
  const { profile } = await requireAuth();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("library_categories")
    .delete()
    .eq("id", categoryId);

  if (error) {
    logSupabaseActionError({ action: "deleteCategory", profile, payload: { id: categoryId }, error });
    return { error: buildFriendlyDbErrorMessage(error) };
  }

  createAuditLog({
    ...buildAuditActor(profile),
    action: "library_category_deleted",
    entityType: "library_category",
    entityId: categoryId,
    title: "Kategori silindi",
  });

  revalidatePath("/kutuphane/kategoriler");
  return { success: true };
}
