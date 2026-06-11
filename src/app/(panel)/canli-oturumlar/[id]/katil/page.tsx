import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { JitsiMeeting } from "@/components/live-sessions/jitsi-meeting";
import { requireAuth } from "@/lib/auth";
import { canViewMeeting } from "@/lib/live-sessions/permissions";
import { getSessionById } from "@/lib/live-sessions/queries";
import { markAttendedAction } from "@/lib/live-sessions/actions";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function KatilPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { profile } = await requireAuth();
  const { id } = await params;

  const session = await getSessionById(id);
  if (!session) notFound();

  const participantIds = session.participants?.map((p) => p.profile_id) ?? [];

  if (!canViewMeeting(profile, session, participantIds)) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <h2 className="text-lg font-semibold">Erişim Yetkiniz Yok</h2>
        <p className="text-sm text-muted-foreground">Bu oturuma katılma yetkiniz bulunmamaktadır.</p>
        <Link href="/canli-oturumlar" className={cn(buttonVariants({ variant: "outline" }))}>
          <ArrowLeft className="mr-1.5 size-4" /> Oturumlara Dön
        </Link>
      </div>
    );
  }

  if (session.status === "cancelled") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <h2 className="text-lg font-semibold">Oturum İptal Edildi</h2>
        <p className="text-sm text-muted-foreground">Bu oturum iptal edildiği için katılamazsınız.</p>
        <Link href="/canli-oturumlar" className={cn(buttonVariants({ variant: "outline" }))}>
          <ArrowLeft className="mr-1.5 size-4" /> Oturumlara Dön
        </Link>
      </div>
    );
  }

  if (session.status === "completed") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <h2 className="text-lg font-semibold">Oturum Tamamlandı</h2>
        <p className="text-sm text-muted-foreground">Bu oturum tamamlandığı için katılamazsınız.</p>
        <Link href="/canli-oturumlar" className={cn(buttonVariants({ variant: "outline" }))}>
          <ArrowLeft className="mr-1.5 size-4" /> Oturumlara Dön
        </Link>
      </div>
    );
  }

  await markAttendedAction(id, profile.id).catch(() => {});

  return <JitsiMeeting session={session} displayName={profile.full_name} fullScreen />;
}
