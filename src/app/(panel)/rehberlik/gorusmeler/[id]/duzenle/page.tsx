import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { canManageGuidance } from "@/lib/guidance/permissions";
import { getInterviewById } from "@/lib/guidance/queries";
import { InterviewForm } from "@/components/guidance/interview-form";
import { updateInterviewAction } from "@/lib/guidance/actions";

export default async function GorusmeDuzenlePage({ params }: { params: Promise<{ id: string }> }) {
  const { profile } = await requireAuth();
  const { id } = await params;

  if (!await canManageGuidance(profile)) {
    return <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Bu işlem için yetkiniz bulunmamaktadır.</div>;
  }

  const interview = await getInterviewById(id, profile);
  if (!interview) notFound();

  const supabase = await createSupabaseServerClient();
  const { data: students } = await supabase.from("students").select("id, full_name").eq("status", "active").order("full_name");

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Rehberlik" title="Görüşme Düzenle" description={interview.title} />
      <InterviewForm
        action={updateInterviewAction}
        preselectedStudentId={interview.student_id}
        students={students ?? []}
        defaultValues={{
          student_id: interview.student_id,
          interview_date: interview.interview_date,
          interview_type: interview.interview_type,
          visibility: interview.visibility,
          title: interview.title,
          summary: interview.summary ?? "",
          private_notes: interview.private_notes ?? "",
          emotional_state: interview.emotional_state ?? "",
          academic_state: interview.academic_state ?? "",
          social_state: interview.social_state ?? "",
          action_plan: interview.action_plan ?? "",
          next_follow_up_date: interview.next_follow_up_date ?? "",
          status: interview.status,
        }}
      />
    </div>
  );
}
