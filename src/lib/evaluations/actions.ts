"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAuth } from "@/lib/auth";
import { buildAuditActor, createAuditLog } from "@/lib/audit/log";
import { canEditStudentEvaluations } from "@/lib/evaluations/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAcademicTermWritable } from "@/lib/terms/guards";
import { getStudentById } from "@/lib/students/queries";
import { logSupabaseActionError, buildFriendlyDbErrorMessage } from "@/lib/supabase-action-error";

const optionalScore = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  return value.trim() === "" ? null : Number(value);
}, z.number().min(0).max(100).nullable());

const evaluationSchema = z
  .object({
    student_id: z.string().uuid(),
    term_id: z.string().uuid("Dönem seçilmelidir."),
    behavior_score: optionalScore,
    attendance_score: optionalScore,
    lesson_performance_score: optionalScore,
    discipline_score: optionalScore,
    memorization_score: optionalScore,
    general_opinion: z.string().trim().nullable().transform((value) => (value && value.length > 0 ? value : null)),
  })
  .superRefine((data, context) => {
    const hasScore = [
      data.behavior_score,
      data.attendance_score,
      data.lesson_performance_score,
      data.discipline_score,
      data.memorization_score,
    ].some((score) => score !== null);
    if (!hasScore && !data.general_opinion) {
      context.addIssue({ code: "custom", message: "En az bir puan veya genel kanaat girilmelidir." });
    }
  });

export async function saveEvaluationAction(formData: FormData) {
  const { profile } = await requireAuth();
  const parsed = evaluationSchema.safeParse(Object.fromEntries(formData));
  const studentId = String(formData.get("student_id") ?? "");

  if (!parsed.success) {
    redirect(`/kanaat-sistemi/kanaat-girisi/${studentId}?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Form hatalı.")}`);
  }

  const student = await getStudentById(parsed.data.student_id);
  if (!student) redirect("/kanaat-sistemi/kanaat-girisi?error=not-found");
  if (!canEditStudentEvaluations(profile, student, student.course_class)) {
    redirect(`/kanaat-sistemi/kanaat-girisi/${student.id}?error=unauthorized`);
  }

  try {
    await requireAcademicTermWritable(parsed.data.term_id);
  } catch {
    redirect(`/kanaat-sistemi/kanaat-girisi/${student.id}?error=term-closed`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("student_evaluations").upsert(
    {
      student_id: student.id,
      term_id: parsed.data.term_id,
      behavior_score: parsed.data.behavior_score,
      attendance_score: parsed.data.attendance_score,
      lesson_performance_score: parsed.data.lesson_performance_score,
      discipline_score: parsed.data.discipline_score,
      memorization_score: parsed.data.memorization_score,
      general_opinion: parsed.data.general_opinion,
      created_by: profile.id,
      updated_by: profile.id,
    },
    { onConflict: "student_id,term_id" },
  );

  if (error) redirect(`/kanaat-sistemi/kanaat-girisi/${student.id}?error=save`);

  await createAuditLog({
    ...buildAuditActor(profile),
    action: "evaluation_saved",
    title: "Kanaat girildi/güncellendi",
    description: `${student.full_name} için kanaat kaydı işlendi.`,
    entityType: "evaluation",
    entityId: student.id,
    studentId: student.id,
    beforeData: null,
    afterData: {
      term_id: parsed.data.term_id,
      behavior_score: parsed.data.behavior_score,
      attendance_score: parsed.data.attendance_score,
      lesson_performance_score: parsed.data.lesson_performance_score,
      discipline_score: parsed.data.discipline_score,
      memorization_score: parsed.data.memorization_score,
      general_opinion: parsed.data.general_opinion,
    },
    metadata: {
      has_scores: [
        parsed.data.behavior_score,
        parsed.data.attendance_score,
        parsed.data.lesson_performance_score,
        parsed.data.discipline_score,
        parsed.data.memorization_score,
      ].some((score) => score !== null),
    },
  });

  revalidatePath(`/talebeler/${student.id}`);
  revalidatePath(`/kanaat-sistemi/kanaat-girisi/${student.id}`);
  redirect(`/kanaat-sistemi/kanaat-girisi/${student.id}?success=saved&term=${parsed.data.term_id}`);
}

export async function deleteEvaluationAction(evaluationId: string) {
  const { profile } = await requireAuth();
  const supabase = await createSupabaseServerClient();

  const { data: evaluation } = await supabase
    .from("student_evaluations")
    .select("id, student_id")
    .eq("id", evaluationId)
    .single();

  if (!evaluation) {
    return { error: "Kanaat kaydı bulunamadı." };
  }

  const student = await getStudentById(evaluation.student_id);

  if (!student) {
    return { error: "Öğrenci bulunamadı." };
  }

  if (!canEditStudentEvaluations(profile, student, student.course_class)) {
    return { error: "Bu işlem için yetkiniz bulunmamaktadır." };
  }

  const { error } = await supabase
    .from("student_evaluations")
    .delete()
    .eq("id", evaluationId);

  if (error) {
    logSupabaseActionError({ action: "deleteEvaluation", profile, payload: { id: evaluationId }, error });
    return { error: buildFriendlyDbErrorMessage(error) };
  }

  createAuditLog({
    ...buildAuditActor(profile),
    action: "evaluation_deleted",
    entityType: "evaluation",
    entityId: evaluationId,
    title: "Kanaat kaydı silindi",
  });

  revalidatePath("/kanaat-sistemi");
  return { success: true };
}
