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

export async function getHafizlikStudentsForBulk(profileId: string) {
  const supabase = await createSupabaseServerClient();

  const { data: hafizlikDepartment } = await supabase
    .from("departments")
    .select("id, name")
    .eq("slug", "hafizlik")
    .single();

  if (!hafizlikDepartment) {
    return { students: [], department: null };
  }

  const { data: students } = await supabase
    .from("students")
    .select(`
      id,
      full_name,
      course_class:classes!inner(id, name, department_id, class_teacher_id)
    `)
    .eq("status", "active")
    .eq("course_class.department_id", hafizlikDepartment.id);

  const { data: progress } = await supabase
    .from("hafizlik_progress")
    .select("*")
    .in("student_id", (students ?? []).map((s: any) => s.id));

  const { data: teachers } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", (students ?? []).map((s: any) => s.course_class?.class_teacher_id).filter(Boolean));

  const teacherMap = new Map((teachers ?? []).map((t: any) => [t.id, t.full_name]));
  const progressMap = new Map((progress ?? []).map((p: any) => [p.student_id, p]));

  return {
    students: (students ?? []).map((s: any) => ({
      ...s,
      progress: progressMap.get(s.id) ?? null,
      teacherName: teacherMap.get(s.course_class?.class_teacher_id) ?? null,
    })),
    department: hafizlikDepartment,
  };
}

export async function bulkUpdateHafizlikProgressAction(formData: FormData) {
  const { profile } = await requireAuth();

  const studentIds = formData.getAll("student_ids") as string[];
  const current_juz = formData.get("current_juz");
  const current_page = formData.get("current_page");
  const status = formData.get("status");
  const target_completion_date = formData.get("target_completion_date");
  const teacher_note = formData.get("teacher_note");

  if (studentIds.length === 0) {
    return { error: "Öğrenci seçilmedi." };
  }

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
  }

  revalidatePath("/hafizlik");
  redirect("/hafizlik/guncelle?success=" + studentIds.length);
}