import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil, User, CalendarDays, ExternalLink } from "lucide-react";

import { CopyMeetingLinkButton } from "@/components/live-sessions/copy-meeting-link-button";
import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth";
import { canEditSession, canDeleteSession, canJoinSession, canViewMeeting } from "@/lib/live-sessions/permissions";
import { getSessionById } from "@/lib/live-sessions/queries";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { cn } from "@/lib/utils";

const sessionTypeLabels: Record<string, string> = {
  ogretmen_toplantisi: "Öğretmen Toplantısı",
  konuk_semineri: "Konuk Semineri",
  bolum_toplantisi: "Bölüm Toplantısı",
  veli_gorusmesi: "Veli Görüşmesi",
  ozel_etkinlik: "Özel Etkinlik",
};

const statusLabels: Record<string, string> = {
  planned: "Planlandı",
  active: "Aktif",
  completed: "Tamamlandı",
  cancelled: "İptal",
};

const statusColors: Record<string, string> = {
  planned: "border-blue-200 bg-blue-50 text-blue-700",
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  completed: "border-gray-200 bg-gray-50 text-gray-600",
  cancelled: "border-red-200 bg-red-50 text-red-700",
};

export default async function OturumDetayPage({ params }: { params: Promise<{ id: string }> }) {
  const { profile } = await requireAuth();
  const { id } = await params;

  const session = await getSessionById(id);
  if (!session) notFound();

  const participantIds = session.participants?.map((participant) => participant.profile_id) ?? [];
  const canOpenMeeting = canViewMeeting(profile, session, participantIds);
  const canEdit = canEditSession(profile, session);
  const canDelete = canDeleteSession(profile, session);
  const canJoin = canJoinSession(profile) && canOpenMeeting;
  const isCreator = session.created_by === profile.id;
  const isParticipant = session.participants?.some((p) => p.profile_id === profile.id);
  const isCancellable = session.status !== "completed" && session.status !== "cancelled";

  if (!canOpenMeeting) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <h2 className="text-lg font-semibold">Erisim Yetkiniz Yok</h2>
        <p className="text-sm text-muted-foreground">Bu oturumu goruntuleme yetkiniz bulunmamaktadir.</p>
        <Link href="/canli-oturumlar" className={cn(buttonVariants({ variant: "outline" }))}>
          <ArrowLeft className="mr-1.5 size-4" /> Oturumlara Don
        </Link>
      </div>
    );
  }

  const sc = statusColors[session.status] ?? "";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Canlı Oturumlar"
        title={session.title}
        actions={
          <div className="flex items-center gap-2">
            {canEdit && isCancellable ? (
              <Link href={`/canli-oturumlar/${id}/duzenle`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                <Pencil className="mr-1.5 size-4" /> Düzenle
              </Link>
            ) : null}
            <CopyMeetingLinkButton sessionId={id} />
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardContent className="space-y-5 pt-6">
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium", sc)}>
                  {statusLabels[session.status] ?? session.status}
                </span>
                <span className="inline-flex items-center rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600">
                  {sessionTypeLabels[session.session_type] ?? session.session_type}
                </span>
                {session.department && (
                  <span className="rounded-md bg-muted/50 px-2 py-0.5 text-xs font-medium">{session.department.name}</span>
                )}
              </div>

              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <InfoRow
                  icon={<User className="size-3.5" />}
                  label="Oluşturan"
                  value={session.creator?.full_name ?? "—"}
                />
                <InfoRow
                  icon={<CalendarDays className="size-3.5" />}
                  label="Başlangıç"
                  value={new Date(session.start_time).toLocaleString("tr-TR", { dateStyle: "long", timeStyle: "short" })}
                />
                {session.end_time && (
                  <InfoRow
                    icon={<CalendarDays className="size-3.5" />}
                    label="Bitiş"
                    value={new Date(session.end_time).toLocaleString("tr-TR", { dateStyle: "long", timeStyle: "short" })}
                  />
                )}
                <InfoRow
                  icon={<User className="size-3.5" />}
                  label="Katılımcı"
                  value={`${session.participant_count} / ${session.max_participants}`}
                />
              </div>

              {session.description && (
                <div className="border-t border-border pt-4">
                  <p className="mb-1 text-xs font-medium text-muted-foreground">Açıklama</p>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">{session.description}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {session.participants && session.participants.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <User className="size-4" /> Katılımcılar ({session.participants.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-border">
                {session.participants.map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <div className="flex size-7 items-center justify-center rounded-full bg-[#093657]/10 text-[10px] font-semibold text-[#093657]">
                        {p.profile.full_name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{p.profile.full_name}</p>
                        <p className="text-[11px] text-muted-foreground capitalize">{p.status}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {session.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Notlar</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{session.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          {canJoin && (session.status === "planned" || session.status === "active") && (
            <Card className="border-emerald-200 bg-emerald-50">
              <CardContent className="p-4">
                <Link
                  href={`/canli-oturumlar/${id}/katil`}
                  className={cn(buttonVariants({ className: "w-full" }))}
                >
                  <ExternalLink className="mr-1.5 size-4" /> Toplantıya Katıl
                </Link>
                <p className="mt-2 text-center text-[10px] text-emerald-700">
                  Oda: {session.room_name}
                </p>
                <CopyMeetingLinkButton sessionId={id} variant="secondary" className="mt-3 w-full" />
              </CardContent>
            </Card>
          )}

          {canJoin && !isCreator && (session.status === "planned" || session.status === "active") && (
            <Card>
              <CardContent className="p-4">
                {isParticipant ? (
                  <form action={async () => {
                    "use server";
                    const { leaveSessionAction } = await import("@/lib/live-sessions/actions");
                    const fd = new FormData();
                    fd.set("id", id);
                    await leaveSessionAction(null, fd);
                  }}>
                    <input type="hidden" name="id" value={id} />
                    <FormSubmitButton variant="outline" className="w-full">
                      Oturumdan Ayrıl
                    </FormSubmitButton>
                  </form>
                ) : (
                  <form action={async () => {
                    "use server";
                    const { joinSessionAction } = await import("@/lib/live-sessions/actions");
                    const fd = new FormData();
                    fd.set("id", id);
                    await joinSessionAction(null, fd);
                  }}>
                    <input type="hidden" name="id" value={id} />
                    <FormSubmitButton className="w-full">
                      Katılacağım
                    </FormSubmitButton>
                  </form>
                )}
              </CardContent>
            </Card>
          )}

          {isCreator && isCancellable && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Yönetim</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <form action={async () => {
                  "use server";
                  const { cancelSessionAction } = await import("@/lib/live-sessions/actions");
                  const fd = new FormData();
                  fd.set("id", id);
                  await cancelSessionAction(null, fd);
                }}>
                  <input type="hidden" name="id" value={id} />
                  <FormSubmitButton variant="outline" className="w-full text-red-600 hover:text-red-700">
                    Oturumu İptal Et
                  </FormSubmitButton>
                </form>
                {canDelete && (
                  <form action={async () => {
                    "use server";
                    const { deleteSessionAction } = await import("@/lib/live-sessions/actions");
                    const fd = new FormData();
                    fd.set("id", id);
                    await deleteSessionAction(null, fd);
                  }}>
                    <input type="hidden" name="id" value={id} />
                    <FormSubmitButton variant="outline" className="w-full text-red-600 hover:text-red-700">
                      Oturumu Sil
                    </FormSubmitButton>
                  </form>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Oturum Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Oda Adı</span>
                <span className="font-mono text-xs">{session.room_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Durum</span>
                <span>{statusLabels[session.status] ?? session.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tür</span>
                <span>{sessionTypeLabels[session.session_type] ?? session.session_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Katılımcı</span>
                <span>{session.participant_count}/{session.max_participants}</span>
              </div>
            </CardContent>
          </Card>

          <Link href="/canli-oturumlar" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full")}>
            <ArrowLeft className="mr-1.5 size-4" /> Tüm Oturumlar
          </Link>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground">{icon}</span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
