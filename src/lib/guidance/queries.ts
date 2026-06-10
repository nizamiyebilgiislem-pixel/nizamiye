import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getGuidanceScopedStudentIds, isGuidanceUnrestricted } from "@/lib/guidance/scope";
import type {
  GuidanceActivityParticipantRow,
  GuidanceActivityRow,
  GuidanceFollowUpRow,
  GuidanceInterviewRow,
  GuidanceSurveyQuestionRow,
  GuidanceSurveyRow,
  ProfileRow,
} from "@/types/database";

export type InterviewWithRelations = GuidanceInterviewRow & {
  student: { id: string; full_name: string } | null;
  counselor: { id: string; full_name: string } | null;
  created_by_profile: { id: string; full_name: string } | null;
};

export type FollowUpWithRelations = GuidanceFollowUpRow & {
  student: { id: string; full_name: string } | null;
  assigned_to_profile: { id: string; full_name: string } | null;
  interview: { id: string; title: string } | null;
};

export type SurveyWithCount = GuidanceSurveyRow & {
  response_count: number;
  question_count: number;
};

export type ActivityWithRelations = GuidanceActivityRow & {
  responsible_profile: { id: string; full_name: string } | null;
  participant_count: number;
};

export type GuidanceDashboardData = {
  total_interviews: number;
  open_follow_ups: number;
  this_month_interviews: number;
  active_surveys: number;
  planned_activities: number;
  upcoming_follow_ups: number;
};

export async function getGuidanceDashboardData(profile?: ProfileRow | null): Promise<GuidanceDashboardData> {
  const supabase = await createSupabaseServerClient();
  const today = new Date().toISOString().split("T")[0];
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];

  const scopedIds = profile && !isGuidanceUnrestricted(profile) ? await getGuidanceScopedStudentIds(profile) : null;

  if (scopedIds !== null && scopedIds.length === 0) {
    return { total_interviews: 0, open_follow_ups: 0, this_month_interviews: 0, active_surveys: 0, planned_activities: 0, upcoming_follow_ups: 0 };
  }

  const maybeFilterStudentIds = (qb: ReturnType<ReturnType<typeof supabase.from>["select"]>) => {
    return scopedIds !== null ? qb.in("student_id", scopedIds) : qb;
  };

  const maybeFilterDepartment = (qb: ReturnType<ReturnType<typeof supabase.from>["select"]>) => {
    return profile?.role === "bolum_muduru" && profile.department_id ? qb.eq("department_id", profile.department_id) : qb;
  };

  const [
    totalInterviews,
    openFollowUps,
    thisMonthInterviews,
    activeSurveys,
    plannedActivities,
    upcomingFollowUps,
  ] = await Promise.all([
    maybeFilterStudentIds(supabase.from("guidance_interviews").select("*", { count: "exact", head: true })),
    maybeFilterStudentIds(supabase.from("guidance_follow_ups").select("*", { count: "exact", head: true }).eq("status", "planned")),
    maybeFilterStudentIds(supabase.from("guidance_interviews").select("*", { count: "exact", head: true }).gte("interview_date", monthStart)),
    maybeFilterDepartment(supabase.from("guidance_surveys").select("*", { count: "exact", head: true }).eq("status", "active")),
    maybeFilterDepartment(supabase.from("guidance_activities").select("*", { count: "exact", head: true }).eq("status", "planned")),
    maybeFilterStudentIds(supabase.from("guidance_follow_ups").select("*", { count: "exact", head: true }).gte("follow_up_date", today).eq("status", "planned")),
  ]);

  return {
    total_interviews: totalInterviews.count ?? 0,
    open_follow_ups: openFollowUps.count ?? 0,
    this_month_interviews: thisMonthInterviews.count ?? 0,
    active_surveys: activeSurveys.count ?? 0,
    planned_activities: plannedActivities.count ?? 0,
    upcoming_follow_ups: upcomingFollowUps.count ?? 0,
  };
}

export async function getRecentInterviews(profile: ProfileRow, limit = 5): Promise<InterviewWithRelations[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("guidance_interviews")
    .select("*, student:student_id(id, full_name), counselor:counselor_id(id, full_name), created_by_profile:created_by(id, full_name)")
    .order("interview_date", { ascending: false })
    .limit(limit);

  if (!isGuidanceUnrestricted(profile)) {
    const scopedIds = (await getGuidanceScopedStudentIds(profile)) ?? [];
    if (scopedIds.length === 0) return [];
    query = query.in("student_id", scopedIds);
  }

  const { data } = await query;
  return (data ?? []) as unknown as InterviewWithRelations[];
}

export async function getUpcomingFollowUps(profile: ProfileRow, limit = 5): Promise<FollowUpWithRelations[]> {
  const supabase = await createSupabaseServerClient();
  const today = new Date().toISOString().split("T")[0];
  let query = supabase
    .from("guidance_follow_ups")
    .select("*, student:student_id(id, full_name), assigned_to_profile:assigned_to(id, full_name), interview:interview_id(id, title)")
    .eq("status", "planned")
    .gte("follow_up_date", today)
    .order("follow_up_date", { ascending: true })
    .limit(limit);

  if (!isGuidanceUnrestricted(profile)) {
    const scopedIds = (await getGuidanceScopedStudentIds(profile)) ?? [];
    if (scopedIds.length === 0) return [];
    query = query.in("student_id", scopedIds);
  }

  const { data } = await query;
  return (data ?? []) as unknown as FollowUpWithRelations[];
}

export async function getActiveSurveys(profile: ProfileRow, limit = 5): Promise<SurveyWithCount[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("guidance_surveys")
    .select("*, question_count:guidance_survey_questions(count)")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (profile.role === "bolum_muduru" && profile.department_id) {
    query = query.eq("department_id", profile.department_id);
  }

  const { data } = await query;
  const surveys = (data ?? []) as unknown as (GuidanceSurveyRow & { question_count: { count: number } })[];
  return await Promise.all(surveys.map(async (s) => ({
    ...s,
    question_count: s.question_count?.count ?? 0,
    response_count: (await supabase.from("guidance_survey_responses").select("*", { count: "exact", head: true }).eq("survey_id", s.id)).count ?? 0,
  })));
}

export async function getPlannedActivities(profile: ProfileRow, limit = 5): Promise<ActivityWithRelations[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("guidance_activities")
    .select("*, responsible_profile:responsible_profile_id(id, full_name)")
    .eq("status", "planned")
    .order("activity_date", { ascending: true })
    .limit(limit);

  if (profile.role === "bolum_muduru" && profile.department_id) {
    query = query.eq("department_id", profile.department_id);
  }

  const { data } = await query;
  const activities = (data ?? []) as unknown as (GuidanceActivityRow & { responsible_profile: { id: string; full_name: string } | null })[];
  return await Promise.all(activities.map(async (a) => ({
    ...a,
    participant_count: (await supabase.from("guidance_activity_participants").select("*", { count: "exact", head: true }).eq("activity_id", a.id)).count ?? 0,
  })));
}

export type InterviewFilters = {
  search?: string;
  status?: string;
  interview_type?: string;
  counselor_id?: string;
  date_from?: string;
  date_to?: string;
};

export async function getInterviews(
  profile: ProfileRow,
  filters?: InterviewFilters
): Promise<InterviewWithRelations[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("guidance_interviews")
    .select("*, student:student_id(id, full_name), counselor:counselor_id(id, full_name), created_by_profile:created_by(id, full_name)")
    .order("interview_date", { ascending: false });

  if (!isGuidanceUnrestricted(profile)) {
    const scopedIds = (await getGuidanceScopedStudentIds(profile)) ?? [];
    if (scopedIds.length === 0) return [];
    query = query.in("student_id", scopedIds);
  }

  if (filters?.search) {
    const term = `%${filters.search}%`;
    query = query.or(`title.ilike.${term},summary.ilike.${term}`);
  }

  if (filters?.status) {
    query = query.eq("status", filters.status as "open" | "followed" | "closed");
  }

  if (filters?.interview_type) {
    query = query.eq("interview_type", filters.interview_type as "individual" | "group" | "parent" | "emergency" | "follow_up");
  }

  if (filters?.counselor_id) {
    query = query.eq("counselor_id", filters.counselor_id);
  }

  if (filters?.date_from) {
    query = query.gte("interview_date", filters.date_from);
  }

  if (filters?.date_to) {
    query = query.lte("interview_date", filters.date_to);
  }

  const { data } = await query;
  return (data ?? []) as unknown as InterviewWithRelations[];
}

export async function getInterviewById(id: string, profile?: ProfileRow | null): Promise<InterviewWithRelations | null> {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("guidance_interviews")
    .select("*, student:student_id(id, full_name), counselor:counselor_id(id, full_name), created_by_profile:created_by(id, full_name)")
    .eq("id", id);

  if (profile && !isGuidanceUnrestricted(profile)) {
    const scopedIds = (await getGuidanceScopedStudentIds(profile)) ?? [];
    if (scopedIds.length === 0) return null;
    query = query.in("student_id", scopedIds);
  }

  const { data } = await query.single();
  return (data ?? null) as unknown as InterviewWithRelations | null;
}

export type FollowUpFilters = {
  status?: string;
  student_id?: string;
  assigned_to?: string;
  date_from?: string;
  date_to?: string;
};

export async function getFollowUps(
  profile: ProfileRow,
  filters?: FollowUpFilters
): Promise<FollowUpWithRelations[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("guidance_follow_ups")
    .select("*, student:student_id(id, full_name), assigned_to_profile:assigned_to(id, full_name), interview:interview_id(id, title)")
    .order("follow_up_date", { ascending: false });

  if (!isGuidanceUnrestricted(profile)) {
    const scopedIds = (await getGuidanceScopedStudentIds(profile)) ?? [];
    if (scopedIds.length === 0) return [];
    query = query.in("student_id", scopedIds);
  }

  if (filters?.status) {
    query = query.eq("status", filters.status as "planned" | "completed" | "cancelled");
  }

  if (filters?.student_id) {
    query = query.eq("student_id", filters.student_id);
  }

  if (filters?.assigned_to) {
    query = query.eq("assigned_to", filters.assigned_to);
  }

  if (filters?.date_from) {
    query = query.gte("follow_up_date", filters.date_from);
  }

  if (filters?.date_to) {
    query = query.lte("follow_up_date", filters.date_to);
  }

  const { data } = await query;
  return (data ?? []) as unknown as FollowUpWithRelations[];
}

export async function getFollowUpById(id: string, profile?: ProfileRow | null): Promise<FollowUpWithRelations | null> {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("guidance_follow_ups")
    .select("*, student:student_id(id, full_name), assigned_to_profile:assigned_to(id, full_name), interview:interview_id(id, title)")
    .eq("id", id);

  if (profile && !isGuidanceUnrestricted(profile)) {
    const scopedIds = (await getGuidanceScopedStudentIds(profile)) ?? [];
    if (scopedIds.length === 0) return null;
    query = query.in("student_id", scopedIds);
  }

  const { data } = await query.single();
  return (data ?? null) as unknown as FollowUpWithRelations | null;
}

export async function getSurveys(profile?: ProfileRow | null): Promise<SurveyWithCount[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("guidance_surveys")
    .select("*, question_count:guidance_survey_questions(count)")
    .order("created_at", { ascending: false });

  if (profile?.role === "bolum_muduru" && profile.department_id) {
    query = query.eq("department_id", profile.department_id);
  }

  const { data } = await query;
  const surveys = (data ?? []) as unknown as (GuidanceSurveyRow & { question_count: { count: number } })[];
  return await Promise.all(surveys.map(async (s) => ({
    ...s,
    question_count: s.question_count?.count ?? 0,
    response_count: (await supabase.from("guidance_survey_responses").select("*", { count: "exact", head: true }).eq("survey_id", s.id)).count ?? 0,
  })));
}

export async function getSurveyById(id: string): Promise<(GuidanceSurveyRow & { questions: GuidanceSurveyQuestionRow[] }) | null> {
  const supabase = await createSupabaseServerClient();
  const { data: survey } = await supabase
    .from("guidance_surveys")
    .select("*")
    .eq("id", id)
    .single();

  if (!survey) return null;

  const { data: questions } = await supabase
    .from("guidance_survey_questions")
    .select("*")
    .eq("survey_id", id)
    .order("sort_order", { ascending: true });

  return { ...survey, questions: questions ?? [] } as unknown as GuidanceSurveyRow & { questions: GuidanceSurveyQuestionRow[] };
}

export async function getSurveyResults(surveyId: string) {
  const supabase = await createSupabaseServerClient();
  const survey = await getSurveyById(surveyId);
  if (!survey) return null;

  const { data: responses } = await supabase
    .from("guidance_survey_responses")
    .select("id")
    .eq("survey_id", surveyId);

  const responseIds = (responses ?? []).map((r) => r.id);
  const totalResponses = responseIds.length;

  const results = await Promise.all(survey.questions.map(async (question) => {
    const { data: answers } = await supabase
      .from("guidance_survey_answers")
      .select("*")
      .eq("question_id", question.id)
      .in("response_id", responseIds.length > 0 ? responseIds : [""]);

    const answerList = answers ?? [];

    let result: Record<string, unknown> = {};

    if (question.question_type === "scale") {
      const numbers = answerList.map((a) => Number(a.answer_number)).filter((n) => !isNaN(n));
      result = {
        average: numbers.length > 0 ? numbers.reduce((a, b) => a + b, 0) / numbers.length : null,
        count: numbers.length,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
      numbers.forEach((n) => { (result.distribution as Record<number, number>)[n] = ((result.distribution as Record<number, number>)[n] ?? 0) + 1; });
    } else if (question.question_type === "yes_no") {
      const yesCount = answerList.filter((a) => a.answer_text === "yes").length;
      const noCount = answerList.filter((a) => a.answer_text === "no").length;
      result = { yes: yesCount, no: noCount, total: answerList.length };
    } else if (question.question_type === "choice") {
      const counts: Record<string, number> = {};
      answerList.forEach((a) => {
        const val = a.answer_text ?? "";
        counts[val] = (counts[val] ?? 0) + 1;
      });
      result = { counts, total: answerList.length };
    } else {
      result = { answers: answerList.map((a) => a.answer_text).filter(Boolean), total: answerList.length };
    }

    return { question, result };
  }));

  return { survey, totalResponses, results };
}

export async function getActivities(profile?: ProfileRow | null, filters?: { status?: string; activity_type?: string }): Promise<ActivityWithRelations[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("guidance_activities")
    .select("*, responsible_profile:responsible_profile_id(id, full_name)")
    .order("activity_date", { ascending: false });

  if (profile?.role === "bolum_muduru" && profile.department_id) {
    query = query.eq("department_id", profile.department_id);
  }

  if (filters?.status) {
    query = query.eq("status", filters.status as "planned" | "completed" | "cancelled");
  }

  if (filters?.activity_type) {
    query = query.eq("activity_type", filters.activity_type as "trip" | "seminar" | "meeting" | "sports" | "cultural" | "activity");
  }

  const { data } = await query;
  const activities = (data ?? []) as unknown as (GuidanceActivityRow & { responsible_profile: { id: string; full_name: string } | null })[];
  return await Promise.all(activities.map(async (a) => ({
    ...a,
    participant_count: (await supabase.from("guidance_activity_participants").select("*", { count: "exact", head: true }).eq("activity_id", a.id)).count ?? 0,
  })));
}

export type ActivityWithResponsible = GuidanceActivityRow & {
  responsible_profile: { id: string; full_name: string } | null;
  participants: (GuidanceActivityParticipantRow & { student: { id: string; full_name: string } | null; profile: { id: string; full_name: string } | null })[];
};

export async function getActivityById(id: string): Promise<ActivityWithResponsible | null> {
  const supabase = await createSupabaseServerClient();

  const { data: activity } = await supabase
    .from("guidance_activities")
    .select("*, responsible_profile:responsible_profile_id(id, full_name)")
    .eq("id", id)
    .single() as unknown as { data: ActivityWithResponsible | null };

  if (!activity) return null;

  const { data: participants } = await supabase
    .from("guidance_activity_participants")
    .select("*, student:student_id(id, full_name), profile:profile_id(id, full_name)")
    .eq("activity_id", id);

  return { ...activity, participants: participants ?? [] };
}

export async function getStudentInterviews(studentId: string, profile?: ProfileRow | null): Promise<InterviewWithRelations[]> {
  const supabase = await createSupabaseServerClient();

  if (profile && !isGuidanceUnrestricted(profile)) {
    const scopedIds = (await getGuidanceScopedStudentIds(profile)) ?? [];
    if (!scopedIds.includes(studentId)) return [];
  }

  const { data } = await supabase
    .from("guidance_interviews")
    .select("*, student:student_id(id, full_name), counselor:counselor_id(id, full_name), created_by_profile:created_by(id, full_name)")
    .eq("student_id", studentId)
    .order("interview_date", { ascending: false });

  return (data ?? []) as unknown as InterviewWithRelations[];
}

export async function getStudentFollowUps(studentId: string, profile?: ProfileRow | null): Promise<FollowUpWithRelations[]> {
  const supabase = await createSupabaseServerClient();

  if (profile && !isGuidanceUnrestricted(profile)) {
    const scopedIds = (await getGuidanceScopedStudentIds(profile)) ?? [];
    if (!scopedIds.includes(studentId)) return [];
  }

  const { data } = await supabase
    .from("guidance_follow_ups")
    .select("*, student:student_id(id, full_name), assigned_to_profile:assigned_to(id, full_name), interview:interview_id(id, title)")
    .eq("student_id", studentId)
    .order("follow_up_date", { ascending: false });

  return (data ?? []) as unknown as FollowUpWithRelations[];
}

export async function getStudentActivities(studentId: string, profile?: ProfileRow | null): Promise<ActivityWithRelations[]> {
  const supabase = await createSupabaseServerClient();

  if (profile && !isGuidanceUnrestricted(profile)) {
    const scopedIds = (await getGuidanceScopedStudentIds(profile)) ?? [];
    if (!scopedIds.includes(studentId)) return [];
  }

  const { data: participations } = await supabase
    .from("guidance_activity_participants")
    .select("activity_id")
    .eq("student_id", studentId);

  if (!participations || participations.length === 0) return [];

  const activityIds = participations.map((p) => p.activity_id);
  const { data: activities } = await supabase
    .from("guidance_activities")
    .select("*, responsible_profile:responsible_profile_id(id, full_name)")
    .in("id", activityIds)
    .order("activity_date", { ascending: false });

  return await Promise.all(((activities ?? []) as unknown as (GuidanceActivityRow & { responsible_profile: { id: string; full_name: string } | null })[]).map(async (a) => ({
    ...a,
    participant_count: (await supabase.from("guidance_activity_participants").select("*", { count: "exact", head: true }).eq("activity_id", a.id)).count ?? 0,
  })));
}

export async function getSurveysForParent(profileId: string): Promise<SurveyWithCount[]> {
  const supabase = await createSupabaseServerClient();

  const { data: links } = await supabase.from("parent_student_links").select("student_id").eq("parent_profile_id", profileId);
  const studentIds = (links ?? []).map((l) => l.student_id);

  const departmentIds = new Set<string>();
  if (studentIds.length > 0) {
    const { data: classes } = await supabase
      .from("classes")
      .select("department_id")
      .in("id", (await supabase.from("students").select("course_class_id").in("id", studentIds).neq("course_class_id", null)).data?.map((s) => s.course_class_id).filter(Boolean) as string[] ?? []);
    for (const cls of classes ?? []) {
      if (cls.department_id) departmentIds.add(cls.department_id);
    }
  }

  const { data } = await supabase
    .from("guidance_surveys")
    .select("*, question_count:guidance_survey_questions(count)")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  const surveys = (data ?? []) as unknown as (GuidanceSurveyRow & { question_count: { count: number } })[];

  const relevant = surveys.filter((s) =>
    s.target_scope === "all_students"
    || (s.target_scope === "department" && s.department_id && departmentIds.has(s.department_id))
  );

  return await Promise.all(relevant.map(async (s) => ({
    ...s,
    question_count: s.question_count?.count ?? 0,
    response_count: (await supabase.from("guidance_survey_responses").select("*", { count: "exact", head: true }).eq("survey_id", s.id)).count ?? 0,
  })));
}

export async function getParentStudentIds(profileId: string): Promise<string[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("parent_student_links").select("student_id").eq("parent_profile_id", profileId);
  return (data ?? []).map((l) => l.student_id);
}

export async function getStudentInterviewsForParent(studentId: string): Promise<InterviewWithRelations[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("guidance_interviews")
    .select("*, student:student_id(id, full_name), counselor:counselor_id(id, full_name), created_by_profile:created_by(id, full_name)")
    .eq("student_id", studentId)
    .in("visibility", ["summary", "shared"])
    .order("interview_date", { ascending: false });

  return (data ?? []) as unknown as InterviewWithRelations[];
}

export async function getDepartmentActivities(departmentId: string): Promise<(GuidanceActivityRow & { participant_count: number })[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("guidance_activities")
    .select("*")
    .eq("department_id", departmentId)
    .order("activity_date", { ascending: false });

  const activities = data ?? [];
  return await Promise.all(activities.map(async (a) => ({
    ...a,
    participant_count: (await supabase.from("guidance_activity_participants").select("*", { count: "exact", head: true }).eq("activity_id", a.id)).count ?? 0,
  })));
}
