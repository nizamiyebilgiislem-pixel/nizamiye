"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAuth } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { canManageHafizlikProgress } from "@/lib/hafizlik/permissions";
import { getHafizlikDepartmentScope, getHafizlikStudentsByDepartment } from "@/lib/hafizlik/queries";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProfileRow } from "@/types/database";
import { logSupabaseActionError, buildFriendlyDbErrorMessage } from "@/lib/supabase-action-error";

const updateProgressSchema = z.object({
  student_id: z.string().uuid(),
  current_juz: z.coerce.number().int().min(1).max(30),
  current_page: z.coerce.number().int().min(1).max(604),
  status: z.enum(["learning", "reviewing", "completed"]),
  target_completion_date: z.string().nullable(),
  teacher_note: z.string().nullable(),
});

export async function updateHafizlikProgressAction(formData: FormData) {
  const { profile } = await requireAuth();

  const rawData = {
    student_id: formData.get("student_id"),
    current_juz: formData.get("current_juz"),
    current_page: formData.get("current_page"),
    status: formData.get("status"),
    target_completion_date: formData.get("target_completion_date"),
    teacher_note: formData.get("teacher_note"),
  };

  const parsed = updateProgressSchema.safeParse(rawData);
  if (!parsed.success) {
    throw new Error("Geçersiz veri.");
  }

  const supabase = await createSupabaseServerClient();
  const permResult = await canManageHafizlikProgress(supabase, profile, parsed.data.student_id);
  if (permResult.error) {
    throw new Error(permResult.error.message);
  }

  const existingResult = await supabase
    .from("hafizlik_progress")
    .select("*")
    .eq("student_id", parsed.data.student_id)
    .maybeSingle();

  const upsertData = {
    current_juz: parsed.data.current_juz,
    current_page: parsed.data.current_page,
    status: parsed.data.status,
    target_completion_date: parsed.data.target_completion_date || null,
    teacher_note: parsed.data.teacher_note || null,
    updated_by: profile.id,
  };

  let result;
  if (existingResult.data) {
    result = await supabase
      .from("hafizlik_progress")
      .update(upsertData)
      .eq("id", existingResult.data.id)
      .select()
      .single();
  } else {
    result = await supabase
      .from("hafizlik_progress")
      .insert({
        ...upsertData,
        student_id: parsed.data.student_id,
        created_by: profile.id,
      })
      .select()
      .single();
  }

  if (result.error) {
    throw new Error(result.error.message);
  }

  await syncMemorizationScore(supabase, parsed.data.student_id, parsed.data.current_juz, parsed.data.current_page);

  const studentId = parsed.data.student_id;
  revalidatePath(`/talebeler/${studentId}`);
  revalidatePath("/hafizlik");
  revalidatePath(`/hafizlik/${studentId}`);
  return;
}

async function syncMemorizationScore(supabase: SupabaseClient, studentId: string, currentJuz: number, currentPage: number) {
  const activeTermResult = await supabase
    .from("academic_terms")
    .select("id")
    .eq("is_current", true)
    .eq("status", "active")
    .single();

  if (!activeTermResult.data) {
    return;
  }

  const evaluationResult = await supabase
    .from("student_evaluations")
    .select("id, memorization_score")
    .eq("student_id", studentId)
    .eq("term_id", activeTermResult.data.id)
    .maybeSingle();

  if (!evaluationResult.data) {
    return;
  }

  const calculatedScore = Math.round(((currentJuz - 1) * 604 + currentPage) / 604 * 100);

  await supabase
    .from("student_evaluations")
    .update({
      memorization_score: calculatedScore,
      updated_by: (await supabase.auth.getUser()).data.user?.id,
    })
    .eq("id", evaluationResult.data.id);
}

export async function getHafizlikProgress(studentId: string) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("hafizlik_progress")
    .select("*")
    .eq("student_id", studentId)
    .maybeSingle();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

export async function getHafizlikStudentsForBulk(
  profile: Pick<ProfileRow, "role" | "department_id">,
  departmentId?: string | null,
) {
  const scope = await getHafizlikDepartmentScope(profile, departmentId);

  if (!scope.selectedDepartment) {
    return { students: [], department: null, departments: scope.departments, canSelectDepartment: scope.canSelectDepartment };
  }

  const students = await getHafizlikStudentsByDepartment(scope.selectedDepartment.id);

  return {
    students,
    department: scope.selectedDepartment,
    departments: scope.departments,
    canSelectDepartment: scope.canSelectDepartment,
  };
}

export async function bulkUpdateHafizlikProgressAction(formData: FormData): Promise<void> {
  const { profile } = await requireAuth();

  const studentIds = formData.getAll("student_ids") as string[];
  const current_juz = formData.get("current_juz");
  const current_page = formData.get("current_page");
  const status = formData.get("status");
  const target_completion_date = formData.get("target_completion_date");
  const teacher_note = formData.get("teacher_note");
  const departmentId = String(formData.get("department_id") ?? "").trim();

  if (studentIds.length === 0) {
    throw new Error("Öğrenci seçilmedi.");
  }

  let updatedCount = 0;

  const supabase = await createSupabaseServerClient();

  for (const studentId of studentIds) {
    const permResult = await canManageHafizlikProgress(supabase, profile, studentId);
    if (permResult.error) continue;

    const existingResult = await supabase
      .from("hafizlik_progress")
      .select("*")
      .eq("student_id", studentId)
      .maybeSingle();

    const upsertData = {
      current_juz: Number(current_juz),
      current_page: Number(current_page),
      status: status as "learning" | "reviewing" | "completed",
      target_completion_date: target_completion_date ? String(target_completion_date) : null,
      teacher_note: teacher_note ? String(teacher_note) : null,
      updated_by: profile.id,
    };

    if (existingResult.data) {
      await supabase
        .from("hafizlik_progress")
        .update(upsertData)
        .eq("id", existingResult.data.id);
    } else {
      await supabase
        .from("hafizlik_progress")
        .insert({
          ...upsertData,
          student_id: studentId,
          created_by: profile.id,
        });
    }

    await syncMemorizationScore(supabase, studentId, Number(current_juz), Number(current_page));
    updatedCount += 1;
  }

  revalidatePath("/hafizlik");
  redirect(`/hafizlik/guncelle?success=${updatedCount}${departmentId ? `&department=${departmentId}` : ""}`);
}

export async function deleteHafizlikProgressAction(progressId: string) {
  const { profile } = await requireAuth();
  const supabase = await createSupabaseServerClient();
  const parsedProgressId = z.string().uuid().safeParse(progressId);

  if (!parsedProgressId.success) {
    return { error: "Geçersiz hafızlık kaydı." };
  }

  const { data: progress, error: progressError } = await supabase
    .from("hafizlik_progress")
    .select("student_id")
    .eq("id", parsedProgressId.data)
    .maybeSingle();

  if (progressError) {
    logSupabaseActionError({ action: "deleteHafizlikProgress.lookup", profile, payload: { id: parsedProgressId.data }, error: progressError });
    return { error: buildFriendlyDbErrorMessage(progressError) };
  }

  if (!progress?.student_id) {
    return { error: "Hafızlık kaydı bulunamadı." };
  }

  const permResult = await canManageHafizlikProgress(supabase, profile, progress.student_id);
  if (permResult.error) {
    return { error: permResult.error.message };
  }

  const { error } = await supabase
    .from("hafizlik_progress")
    .delete()
    .eq("id", parsedProgressId.data);

  if (error) {
    logSupabaseActionError({ action: "deleteHafizlikProgress", profile, payload: { id: parsedProgressId.data }, error });
    return { error: buildFriendlyDbErrorMessage(error) };
  }

  revalidatePath("/hafizlik");
  return { success: true };
}
