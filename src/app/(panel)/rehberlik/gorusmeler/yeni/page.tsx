import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { canManageGuidance } from "@/lib/guidance/permissions";
import { InterviewForm } from "@/components/guidance/interview-form";
import { createInterviewAction } from "@/lib/guidance/actions";

type Props = {
  searchParams: Promise<{ student_id?: string }>;
};

export default async function YeniGorusmePage({ searchParams }: Props) {
  const { profile } = await requireAuth();
  const params = await searchParams;

  if (!await canManageGuidance(profile)) {
    return <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Bu işlem için yetkiniz bulunmamaktadır.</div>;
  }

  const supabase = await createSupabaseServerClient();

  const [{ data: students }] = await Promise.all([
    supabase.from("students").select("id, full_name").eq("status", "active").order("full_name"),
    supabase.from("profiles").select("id, full_name").in("role", ["admin", "genel_mudur", "rehberlik"]).eq("is_active", true).order("full_name"),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Rehberlik" title="Yeni Görüşme" description="Bir öğrenci için rehberlik görüşmesi kaydedin." />
      <InterviewForm
        action={createInterviewAction}
        preselectedStudentId={params.student_id}
        students={students ?? []}
      />
    </div>
  );
}
