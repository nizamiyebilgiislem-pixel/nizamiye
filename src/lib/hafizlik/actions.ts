"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAuth } from "@/lib/auth";
import { buildAuditActor } from "@/lib/audit/log";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { canManageHafizlikProgress } from "@/lib/hafizlik/permissions";
import type { SupabaseClient } from "@supabase/supabase-js";

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
  const actor = buildAuditActor(profile);

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
    return { error: "Geçersiz veri." };
  }

  const supabase = await createSupabaseServerClient();
  const permResult = await canManageHafizlikProgress(supabase, profile, parsed.data.student_id);
  if (permResult.error) {
    return { error: permResult.error.message };
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
    return { error: result.error.message };
  }

  await syncMemorizationScore(supabase, parsed.data.student_id, parsed.data.current_juz, parsed.data.current_page);

  revalidatePath(`/talebeler/${parsed.data.student_id}`);
  return { success: true };
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