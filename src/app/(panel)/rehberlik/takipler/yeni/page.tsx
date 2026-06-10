import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { canManageGuidance } from "@/lib/guidance/permissions";
import { FollowUpForm } from "@/components/guidance/follow-up-form";
import { createFollowUpAction } from "@/lib/guidance/actions";

export default async function YeniTakipPage() {
  const { profile } = await requireAuth();

  if (!await canManageGuidance(profile)) {
    return <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Bu işlem için yetkiniz bulunmamaktadır.</div>;
  }

  const supabase = await createSupabaseServerClient();
  const [{ data: students }, { data: profiles }, { data: interviews }] = await Promise.all([
    supabase.from("students").select("id, full_name").eq("status", "active").order("full_name"),
    supabase.from("profiles").select("id, full_name").in("role", ["admin", "genel_mudur", "rehberlik", "hoca", "bolum_muduru"]).eq("is_active", true).order("full_name"),
    supabase.from("guidance_interviews").select("id, title").eq("status", "open").order("interview_date", { ascending: false }).limit(50),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Rehberlik" title="Yeni Takip Planı" description="Bir öğrenci için takip planı oluşturun." />
      <FollowUpForm
        action={createFollowUpAction}
        students={students ?? []}
        profiles={profiles ?? []}
        interviews={interviews ?? []}
      />
    </div>
  );
}
