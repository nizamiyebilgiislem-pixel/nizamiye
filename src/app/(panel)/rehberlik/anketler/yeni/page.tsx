import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { canManageGuidance } from "@/lib/guidance/permissions";
import { SurveyForm } from "@/components/guidance/survey-form";

export default async function YeniAnketPage() {
  const { profile } = await requireAuth();

  if (!canManageGuidance(profile)) {
    return <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Bu işlem için yetkiniz bulunmamaktadır.</div>;
  }

  const supabase = await createSupabaseServerClient();
  const [{ data: departments }, { data: classes }] = await Promise.all([
    supabase.from("departments").select("id, name").order("name"),
    supabase.from("classes").select("id, name").order("name"),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Rehberlik" title="Yeni Anket" description="Bir öğrenci anketi oluşturun." />
      <SurveyForm departments={departments ?? []} classes={classes ?? []} />
    </div>
  );
}
