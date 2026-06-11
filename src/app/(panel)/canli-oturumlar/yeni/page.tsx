import { PageHeader } from "@/components/layout/page-header";
import { SessionForm } from "@/components/live-sessions/session-form";
import { requireAuth } from "@/lib/auth";
import { canCreateSession } from "@/lib/live-sessions/permissions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export default async function YeniOturumPage() {
  const { profile } = await requireAuth();

  if (!canCreateSession(profile)) {
    return <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Bu işlem için yetkiniz bulunmamaktadır.</div>;
  }

  const supabase = createSupabaseAdminClient();
  const { data: departments } = await supabase
    .from("departments")
    .select("id, name")
    .eq("is_active", true)
    .order("name", { ascending: true });

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Canlı Oturumlar" title="Yeni Oturum" description="Kurum içi Jitsi toplantısı planlayın." />
      <SessionForm
        departmentOptions={departments ?? []}
        currentProfileRole={profile.role}
      />
    </div>
  );
}
