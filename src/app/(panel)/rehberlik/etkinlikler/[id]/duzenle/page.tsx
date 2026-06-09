import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { canManageGuidance } from "@/lib/guidance/permissions";
import { getActivityById } from "@/lib/guidance/queries";
import { ActivityForm } from "@/components/guidance/activity-form";

export default async function EtkinlikDuzenlePage({ params }: { params: Promise<{ id: string }> }) {
  const { profile } = await requireAuth();
  const { id } = await params;

  if (!canManageGuidance(profile)) {
    return <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Bu işlem için yetkiniz bulunmamaktadır.</div>;
  }

  const activity = await getActivityById(id);
  if (!activity) notFound();

  const supabase = await createSupabaseServerClient();
  const { data: profiles } = await supabase.from("profiles").select("id, full_name").eq("is_active", true).order("full_name");

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Rehberlik" title="Etkinlik Düzenle" description={`${activity.title} etkinliğini düzenleyin.`} />
      <ActivityForm
        defaultValues={{
          id: activity.id,
          title: activity.title,
          activity_type: activity.activity_type,
          description: activity.description ?? "",
          location: activity.location ?? "",
          activity_date: activity.activity_date,
          start_time: activity.start_time ?? "",
          end_time: activity.end_time ?? "",
          responsible_profile_id: activity.responsible_profile_id ?? "",
          status: activity.status,
        }}
        profiles={profiles ?? []}
      />
    </div>
  );
}
