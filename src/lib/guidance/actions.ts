"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAuth } from "@/lib/auth";
import { buildAuditActor, createAuditLog } from "@/lib/audit/log";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  canManageInterviews,
  canManageFollowUps,
  canManageSurveys,
  canManageActivities,
} from "@/lib/guidance/permissions";
import { logSupabaseActionError, buildFriendlyDbErrorMessage } from "@/lib/supabase-action-error";

const createInterviewSchema = z.object({
  student_id: z.string().uuid("Talebe seçilmelidir."),
  interview_date: z.string().min(1, "Tarih zorunludur."),
  interview_type: z.enum(["individual", "group", "parent", "emergency", "follow_up"]),
  visibility: z.enum(["private", "summary", "shared"]).default("private"),
  title: z.string().trim().min(1, "Başlık zorunludur."),
  summary: z.string().trim().optional().default(""),
  private_notes: z.string().trim().optional().default(""),
  emotional_state: z.string().trim().optional().default(""),
  academic_state: z.string().trim().optional().default(""),
  social_state: z.string().trim().optional().default(""),
  action_plan: z.string().trim().optional().default(""),
  next_follow_up_date: z.string().optional().default(""),
  status: z.enum(["open", "followed", "closed"]).default("open"),
});

const updateInterviewSchema = z.object({
  id: z.string().uuid(),
  student_id: z.string().uuid("Talebe seçilmelidir."),
  interview_date: z.string().min(1, "Tarih zorunludur."),
  interview_type: z.enum(["individual", "group", "parent", "emergency", "follow_up"]),
  visibility: z.enum(["private", "summary", "shared"]),
  title: z.string().trim().min(1, "Başlık zorunludur."),
  summary: z.string().trim().optional().default(""),
  private_notes: z.string().trim().optional().default(""),
  emotional_state: z.string().trim().optional().default(""),
  academic_state: z.string().trim().optional().default(""),
  social_state: z.string().trim().optional().default(""),
  action_plan: z.string().trim().optional().default(""),
  next_follow_up_date: z.string().optional().default(""),
  status: z.enum(["open", "followed", "closed"]),
});

const createFollowUpSchema = z.object({
  interview_id: z.string().optional().default(""),
  student_id: z.string().uuid("Talebe seçilmelidir."),
  assigned_to: z.string().optional().default(""),
  follow_up_date: z.string().min(1, "Takip tarihi zorunludur."),
  title: z.string().trim().min(1, "Başlık zorunludur."),
  description: z.string().trim().optional().default(""),
  status: z.enum(["planned", "completed", "cancelled"]).default("planned"),
});

const createSurveySchema = z.object({
  title: z.string().trim().min(1, "Anket adı zorunludur."),
  description: z.string().trim().optional().default(""),
  target_scope: z.enum(["all_students", "department", "class"]).default("all_students"),
  department_id: z.string().optional().default(""),
  class_id: z.string().optional().default(""),
  starts_at: z.string().optional().default(""),
  ends_at: z.string().optional().default(""),
  is_anonymous: z.enum(["true", "false"]).default("true"),
  status: z.enum(["draft", "active", "closed"]).default("draft"),
});

const createActivitySchema = z.object({
  title: z.string().trim().min(1, "Başlık zorunludur."),
  activity_type: z.enum(["trip", "seminar", "meeting", "sports", "cultural", "activity"]),
  description: z.string().trim().optional().default(""),
  location: z.string().trim().optional().default(""),
  activity_date: z.string().min(1, "Tarih zorunludur."),
  start_time: z.string().optional().default(""),
  end_time: z.string().optional().default(""),
  responsible_profile_id: z.string().optional().default(""),
  status: z.enum(["planned", "completed", "cancelled"]).default("planned"),
});

export async function createInterviewAction(_previousState: unknown, formData: FormData) {
  const { profile } = await requireAuth();

  if (!(await canManageInterviews(profile))) {
    return { error: "Bu işlem için yetkiniz bulunmamaktadır." };
  }

  const raw = Object.fromEntries(formData);
  const parsed = createInterviewSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues.map((e) => e.message).join(", ") };
  }

  const { student_id, interview_date, interview_type, visibility, title, summary, private_notes, emotional_state, academic_state, social_state, action_plan, next_follow_up_date, status } = parsed.data;
  const supabase = await createSupabaseServerClient();

  const { data: interview, error } = await supabase
    .from("guidance_interviews")
    .insert({
      student_id,
      counselor_id: profile.id,
      interview_date,
      interview_type,
      visibility,
      title,
      summary: summary || null,
      private_notes: private_notes || null,
      emotional_state: emotional_state || null,
      academic_state: academic_state || null,
      social_state: social_state || null,
      action_plan: action_plan || null,
      next_follow_up_date: next_follow_up_date || null,
      status,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error) {
    logSupabaseActionError({ action: "createInterview", profile, payload: parsed.data, error });
    return { error: buildFriendlyDbErrorMessage(error) };
  }

  createAuditLog({
    ...buildAuditActor(profile),
    action: "guidance_interview_created",
    entityType: "guidance_interview",
    entityId: interview.id,
    studentId: student_id,
    title: "Rehberlik görüşmesi oluşturuldu",
    description: `${title} başlıklı görüşme oluşturuldu.`,
    afterData: { student_id, interview_type, status },
  });

  revalidatePath("/rehberlik/gorusmeler");
  revalidatePath(`/talebeler/${student_id}`);
  return { success: true };
}

export async function updateInterviewAction(_previousState: unknown, formData: FormData) {
  const { profile } = await requireAuth();

  if (!(await canManageInterviews(profile))) {
    return { error: "Bu işlem için yetkiniz bulunmamaktadır." };
  }

  const raw = Object.fromEntries(formData);
  const parsed = updateInterviewSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues.map((e) => e.message).join(", ") };
  }

  const { id, student_id, interview_date, interview_type, visibility, title, summary, private_notes, emotional_state, academic_state, social_state, action_plan, next_follow_up_date, status } = parsed.data;
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("guidance_interviews")
    .update({
      student_id,
      interview_date,
      interview_type,
      visibility,
      title,
      summary: summary || null,
      private_notes: private_notes || null,
      emotional_state: emotional_state || null,
      academic_state: academic_state || null,
      social_state: social_state || null,
      action_plan: action_plan || null,
      next_follow_up_date: next_follow_up_date || null,
      status,
    })
    .eq("id", id);

  if (error) {
    logSupabaseActionError({ action: "updateInterview", profile, payload: parsed.data, error });
    return { error: buildFriendlyDbErrorMessage(error) };
  }

  createAuditLog({
    ...buildAuditActor(profile),
    action: "guidance_interview_updated",
    entityType: "guidance_interview",
    entityId: id,
    studentId: student_id,
    title: "Rehberlik görüşmesi güncellendi",
    description: `${title} başlıklı görüşme güncellendi.`,
    afterData: { student_id, interview_type, status },
  });

  revalidatePath("/rehberlik/gorusmeler");
  revalidatePath(`/rehberlik/gorusmeler/${id}`);
  revalidatePath(`/talebeler/${student_id}`);
  return { success: true };
}

export async function createFollowUpAction(_previousState: unknown, formData: FormData) {
  const { profile } = await requireAuth();

  if (!(await canManageFollowUps(profile))) {
    return { error: "Bu işlem için yetkiniz bulunmamaktadır." };
  }

  const raw = Object.fromEntries(formData);
  const parsed = createFollowUpSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues.map((e) => e.message).join(", ") };
  }

  const { interview_id, student_id, assigned_to, follow_up_date, title, description, status } = parsed.data;
  const supabase = await createSupabaseServerClient();

  const { data: followUp, error } = await supabase
    .from("guidance_follow_ups")
    .insert({
      interview_id: interview_id || null,
      student_id,
      assigned_to: assigned_to || null,
      follow_up_date,
      title,
      description: description || null,
      status,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error) {
    logSupabaseActionError({ action: "createFollowUp", profile, payload: parsed.data, error });
    return { error: buildFriendlyDbErrorMessage(error) };
  }

  createAuditLog({
    ...buildAuditActor(profile),
    action: "guidance_follow_up_created",
    entityType: "guidance_follow_up",
    entityId: followUp.id,
    studentId: student_id,
    title: "Takip planı oluşturuldu",
    description: `${title} başlıklı takip oluşturuldu.`,
  });

  revalidatePath("/rehberlik/takipler");
  revalidatePath(`/talebeler/${student_id}`);
  return { success: true };
}

export async function completeFollowUpAction(followUpId: string, formData: FormData) {
  const { profile } = await requireAuth();

  if (!(await canManageFollowUps(profile))) {
    return { error: "Bu işlem için yetkiniz bulunmamaktadır." };
  }

  const resultNote = formData.get("result_note") as string | null;
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("guidance_follow_ups")
    .update({ status: "completed", result_note: resultNote || null })
    .eq("id", followUpId);

  if (error) {
    logSupabaseActionError({ action: "completeFollowUp", profile, payload: { followUpId, resultNote }, error });
    return { error: buildFriendlyDbErrorMessage(error) };
  }

  createAuditLog({
    ...buildAuditActor(profile),
    action: "guidance_follow_up_completed",
    entityType: "guidance_follow_up",
    entityId: followUpId,
    title: "Takip tamamlandı",
    description: "Takip planı tamamlandı.",
  });

  revalidatePath("/rehberlik/takipler");
  revalidatePath(`/rehberlik/takipler/${followUpId}`);
  return { success: true };
}

export async function cancelFollowUpAction(followUpId: string) {
  const { profile } = await requireAuth();

  if (!(await canManageFollowUps(profile))) {
    return { error: "Bu işlem için yetkiniz bulunmamaktadır." };
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("guidance_follow_ups")
    .update({ status: "cancelled" })
    .eq("id", followUpId);

  if (error) {
    logSupabaseActionError({ action: "cancelFollowUp", profile, payload: { followUpId }, error });
    return { error: buildFriendlyDbErrorMessage(error) };
  }

  createAuditLog({
    ...buildAuditActor(profile),
    action: "guidance_follow_up_cancelled",
    entityType: "guidance_follow_up",
    entityId: followUpId,
    title: "Takip iptal edildi",
    description: "Takip planı iptal edildi.",
  });

  revalidatePath("/rehberlik/takipler");
  return { success: true };
}

export async function createSurveyAction(_previousState: unknown, formData: FormData) {
  const { profile } = await requireAuth();

  if (!(await canManageSurveys(profile))) {
    return { error: "Bu işlem için yetkiniz bulunmamaktadır." };
  }

  const raw = Object.fromEntries(formData);
  const parsed = createSurveySchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues.map((e) => e.message).join(", ") };
  }

  const { title, description, target_scope, department_id, class_id, starts_at, ends_at, is_anonymous, status } = parsed.data;
  const supabase = await createSupabaseServerClient();

  const { data: survey, error } = await supabase
    .from("guidance_surveys")
    .insert({
      title,
      description: description || null,
      target_scope,
      department_id: department_id || null,
      class_id: class_id || null,
      starts_at: starts_at || null,
      ends_at: ends_at || null,
      is_anonymous: is_anonymous === "true",
      status,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error) {
    logSupabaseActionError({ action: "createSurvey", profile, payload: parsed.data, error });
    return { error: buildFriendlyDbErrorMessage(error) };
  }

  createAuditLog({
    ...buildAuditActor(profile),
    action: "guidance_survey_created",
    entityType: "guidance_survey",
    entityId: survey.id,
    title: "Anket oluşturuldu",
    description: `${title} anketi oluşturuldu.`,
  });

  revalidatePath("/rehberlik/anketler");
  return { success: true, surveyId: survey.id };
}

export async function closeSurveyAction(surveyId: string) {
  const { profile } = await requireAuth();

  if (!(await canManageSurveys(profile))) {
    return { error: "Bu işlem için yetkiniz bulunmamaktadır." };
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("guidance_surveys")
    .update({ status: "closed" })
    .eq("id", surveyId);

  if (error) {
    logSupabaseActionError({ action: "closeSurvey", profile, payload: { surveyId }, error });
    return { error: buildFriendlyDbErrorMessage(error) };
  }

  createAuditLog({
    ...buildAuditActor(profile),
    action: "guidance_survey_closed",
    entityType: "guidance_survey",
    entityId: surveyId,
    title: "Anket kapatıldı",
    description: "Anket kapatıldı.",
  });

  revalidatePath("/rehberlik/anketler");
  revalidatePath(`/rehberlik/anketler/${surveyId}`);
  return { success: true };
}

export async function saveSurveyQuestionsAction(surveyId: string, formData: FormData) {
  const { profile } = await requireAuth();

  if (!(await canManageSurveys(profile))) {
    return { error: "Bu işlem için yetkiniz bulunmamaktadır." };
  }

  const supabase = await createSupabaseServerClient();

  const questionsJson = formData.get("questions") as string;
  let questions: { text: string; type: string; options: string; sort_order: number; is_required: boolean }[];

  try {
    questions = JSON.parse(questionsJson);
  } catch {
    return { error: "Soru verileri geçersiz." };
  }

  const { error: deleteError } = await supabase
    .from("guidance_survey_questions")
    .delete()
    .eq("survey_id", surveyId);

  if (deleteError) {
    return { error: "Sorular silinemedi." };
  }

  let optionsParsed: string[] | null = null;

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (q.type === "choice" && q.options) {
      optionsParsed = q.options.split(",").map((o) => o.trim()).filter(Boolean);
    }

    const { error } = await supabase.from("guidance_survey_questions").insert({
      survey_id: surveyId,
      question_text: q.text,
      question_type: q.type as "scale" | "choice" | "text" | "yes_no",
      options: q.type === "choice" && optionsParsed ? JSON.stringify(optionsParsed) : null,
      sort_order: q.sort_order,
      is_required: q.is_required,
    });

    if (error) {
      return { error: `Soru kaydedilemedi: ${q.text}` };
    }
  }

  revalidatePath(`/rehberlik/anketler/${surveyId}`);
  return { success: true };
}

export async function submitSurveyResponseAction(surveyId: string, formData: FormData) {
  const { profile } = await requireAuth();

  if (!(await canManageSurveys(profile))) {
    return { error: "Bu işlem için yetkiniz bulunmamaktadır." };
  }

  const supabase = await createSupabaseServerClient();

  const answersJson = formData.get("answers") as string;
  let answers: { question_id: string; text: string | null; number: number | null }[];

  try {
    answers = JSON.parse(answersJson);
  } catch {
    return { error: "Cevap verileri geçersiz." };
  }

  const { data: response, error: responseError } = await supabase
    .from("guidance_survey_responses")
    .insert({ survey_id: surveyId })
    .select("id")
    .single();

  if (responseError) {
    return { error: "Cevap kaydı oluşturulamadı." };
  }

  for (const answer of answers) {
    const { error } = await supabase.from("guidance_survey_answers").insert({
      response_id: response.id,
      question_id: answer.question_id,
      answer_text: answer.text,
      answer_number: answer.number,
    });

    if (error) {
      return { error: "Cevap kaydedilemedi." };
    }
  }

  revalidatePath(`/rehberlik/anketler/${surveyId}`);
  return { success: true };
}

export async function createActivityAction(_previousState: unknown, formData: FormData) {
  const { profile } = await requireAuth();

  if (!(await canManageActivities(profile))) {
    return { error: "Bu işlem için yetkiniz bulunmamaktadır." };
  }

  const raw = Object.fromEntries(formData);
  const parsed = createActivitySchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues.map((e) => e.message).join(", ") };
  }

  const { title, activity_type, description, location, activity_date, start_time, end_time, responsible_profile_id, status } = parsed.data;
  const supabase = await createSupabaseServerClient();

  const { data: activity, error } = await supabase
    .from("guidance_activities")
    .insert({
      title,
      activity_type,
      description: description || null,
      location: location || null,
      activity_date,
      start_time: start_time || null,
      end_time: end_time || null,
      status,
      responsible_profile_id: responsible_profile_id || null,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error) {
    logSupabaseActionError({ action: "createActivity", profile, payload: parsed.data, error });
    return { error: buildFriendlyDbErrorMessage(error) };
  }

  createAuditLog({
    ...buildAuditActor(profile),
    action: "guidance_activity_created",
    entityType: "guidance_activity",
    entityId: activity.id,
    title: "Etkinlik oluşturuldu",
    description: `${title} etkinliği oluşturuldu.`,
  });

  revalidatePath("/rehberlik/etkinlikler");
  revalidatePath(`/rehberlik/etkinlikler/${activity.id}`);
  return { success: true, activityId: activity.id };
}

export async function updateActivityAction(_previousState: unknown, formData: FormData) {
  const { profile } = await requireAuth();

  if (!(await canManageActivities(profile))) {
    return { error: "Bu işlem için yetkiniz bulunmamaktadır." };
  }

  const raw = Object.fromEntries(formData);
  const parsed = z.object({ id: z.string().uuid() }).merge(createActivitySchema).safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues.map((e) => e.message).join(", ") };
  }

  const { id, title, activity_type, description, location, activity_date, start_time, end_time, responsible_profile_id, status } = parsed.data;
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("guidance_activities")
    .update({
      title,
      activity_type,
      description: description || null,
      location: location || null,
      activity_date,
      start_time: start_time || null,
      end_time: end_time || null,
      status,
      responsible_profile_id: responsible_profile_id || null,
    })
    .eq("id", id);

  if (error) {
    logSupabaseActionError({ action: "updateActivity", profile, payload: parsed.data, error });
    return { error: buildFriendlyDbErrorMessage(error) };
  }

  const auditAction = status === "completed" ? "guidance_activity_completed" : "guidance_activity_updated";

  createAuditLog({
    ...buildAuditActor(profile),
    action: auditAction,
    entityType: "guidance_activity",
    entityId: id,
    title: status === "completed" ? "Etkinlik tamamlandı" : "Etkinlik güncellendi",
    description: `${title} etkinliği güncellendi.`,
  });

  revalidatePath("/rehberlik/etkinlikler");
  revalidatePath(`/rehberlik/etkinlikler/${id}`);
  return { success: true };
}

export async function addActivityParticipantsAction(activityId: string, formData: FormData) {
  const { profile } = await requireAuth();

  if (!(await canManageActivities(profile))) {
    return { error: "Bu işlem için yetkiniz bulunmamaktadır." };
  }

  const supabase = await createSupabaseServerClient();

  const participantType = formData.get("participant_type") as string;
  const ids = formData.getAll("student_ids") as string[];

  for (const id of ids) {
    const insertData = participantType === "student"
      ? { activity_id: activityId, student_id: id, participant_type: "student" as const }
      : { activity_id: activityId, profile_id: id, participant_type: "profile" as const };

    const { error } = await supabase.from("guidance_activity_participants").insert(insertData as Record<string, unknown>);
    if (error && !error.message.includes("duplicate")) {
      return { error: "Katılımcı eklenemedi." };
    }
  }

  revalidatePath(`/rehberlik/etkinlikler/${activityId}`);
  return { success: true };
}

export async function updateParticipantAttendanceAction(participantId: string, formData: FormData) {
  const { profile } = await requireAuth();

  if (!(await canManageActivities(profile))) {
    return { error: "Bu işlem için yetkiniz bulunmamaktadır." };
  }

  const supabase = await createSupabaseServerClient();
  const status = formData.get("attendance_status") as string;

  const { error } = await supabase
    .from("guidance_activity_participants")
    .update({ attendance_status: status as "attended" | "absent" })
    .eq("id", participantId);

  if (error) {
    return { error: "Katılım durumu güncellenemedi." };
  }

  revalidatePath("/rehberlik/etkinlikler");
  return { success: true };
}

export async function removeActivityParticipantAction(participantId: string) {
  const { profile } = await requireAuth();

  if (!(await canManageActivities(profile))) {
    return { error: "Bu işlem için yetkiniz bulunmamaktadır." };
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("guidance_activity_participants")
    .delete()
    .eq("id", participantId);

  if (error) {
    return { error: "Katılımcı silinemedi." };
  }

  revalidatePath("/rehberlik/etkinlikler");
  return { success: true };
}

export async function deleteSurveyAction(surveyId: string) {
  const { profile } = await requireAuth();

  if (!(await canManageSurveys(profile))) {
    return { error: "Bu işlem için yetkiniz bulunmamaktadır." };
  }

  const supabase = await createSupabaseServerClient();

  const { error: responsesError } = await supabase.from("guidance_survey_responses").delete().eq("survey_id", surveyId);
  if (responsesError) {
    return { error: "Anket cevapları silinemedi." };
  }

  const { error: questionsError } = await supabase.from("guidance_survey_questions").delete().eq("survey_id", surveyId);
  if (questionsError) {
    return { error: "Anket soruları silinemedi." };
  }

  const { error: surveyError } = await supabase.from("guidance_surveys").delete().eq("id", surveyId);
  if (surveyError) {
    return { error: "Anket silinemedi." };
  }

  revalidatePath("/rehberlik/anketler");
  return { success: true };
}

export async function submitSurveyResponseAsParentAction(surveyId: string, formData: FormData) {
  const { profile } = await requireAuth();

  if (profile.role !== "veli") {
    return { error: "Bu işlem sadece veliler içindir." };
  }

  const supabase = await createSupabaseServerClient();

  const studentId = formData.get("student_id") as string;
  if (!studentId) {
    return { error: "Talebe seçilmelidir." };
  }

  const { data: response, error: responseError } = await supabase
    .from("guidance_survey_responses")
    .insert({ survey_id: surveyId, student_id: studentId, profile_id: profile.id })
    .select("id")
    .single();

  if (responseError) {
    return { error: "Cevap kaydı oluşturulamadı." };
  }

  const questionIds: string[] = [];
  for (const key of formData.keys()) {
    if (key.startsWith("q_")) {
      questionIds.push(key.slice(2));
    }
  }

  for (const questionId of questionIds) {
    const value = formData.get(`q_${questionId}`) as string;
    if (!value) continue;

    const isNumeric = !isNaN(Number(value));
    const { error } = await supabase.from("guidance_survey_answers").insert({
      response_id: response.id,
      question_id: questionId,
      answer_text: isNumeric ? null : value,
      answer_number: isNumeric ? Number(value) : null,
    });

    if (error) {
      return { error: "Cevap kaydedilemedi." };
    }
  }

  revalidatePath("/veli");
  return { success: true };
}

export async function deleteActivityAction(activityId: string) {
  const { profile } = await requireAuth();

  if (!(await canManageActivities(profile))) {
    return { error: "Bu işlem için yetkiniz bulunmamaktadır." };
  }

  const supabase = await createSupabaseServerClient();

  const { error: participantsError } = await supabase.from("guidance_activity_participants").delete().eq("activity_id", activityId);
  if (participantsError) {
    return { error: "Katılımcılar silinemedi." };
  }

  const { error } = await supabase.from("guidance_activities").delete().eq("id", activityId);
  if (error) {
    return { error: "Etkinlik silinemedi." };
  }

  revalidatePath("/rehberlik/etkinlikler");
  return { success: true };
}
