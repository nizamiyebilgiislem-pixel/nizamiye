import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { SessionForm } from "@/components/live-sessions/session-form";
import { requireAuth } from "@/lib/auth";
import { canEditSession } from "@/lib/live-sessions/permissions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export default async function OturumDuzenlePage({ params }: { params: Promise<{ id: string }> }) {
  const { profile } = await requireAuth();
  const { id } = await params;

  const supabase = createSupabaseAdminClient();

  const { data: session } = await supabase
    .from("live_sessions")
    .select("*")
    .eq("id", id)
    .single();

  if (!session) notFound();

  if (!canEditSession(profile, session)) {
    return <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Bu işlem için yetkiniz bulunmamaktadır.</div>;
  }

  if (session.status === "completed" || session.status === "cancelled") {
    return <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Tamamlanmış veya iptal edilmiş oturum düzenlenemez.</div>;
  }

  const { data: departments } = await supabase
    .from("departments")
    .select("id, name")
    .eq("is_active", true)
    .order("name", { ascending: true });

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Canlı Oturumlar" title="Oturumu Düzenle" description="Oturum bilgilerini güncelleyin." />
      <SessionForm
        session={session}
        departmentOptions={departments ?? []}
        currentProfileRole={profile.role}
      />
    </div>
  );
}
