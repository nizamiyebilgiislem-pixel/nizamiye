import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { canManageGuidance } from "@/lib/guidance/permissions";
import { ActivityForm } from "@/components/guidance/activity-form";

export default async function YeniEtkinlikPage() {
  const { profile } = await requireAuth();

  if (!await canManageGuidance(profile)) {
    return <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Bu işlem için yetkiniz bulunmamaktadır.</div>;
  }

  const supabase = await createSupabaseServerClient();
  const { data: profiles } = await supabase.from("profiles").select("id, full_name").eq("is_active", true).order("full_name");

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Rehberlik" title="Yeni Etkinlik" description="Bir etkinlik veya gezi planlayın." />
      <ActivityForm
        profiles={profiles ?? []}
      />
    </div>
  );
}
