import { notFound } from "next/navigation";
import Link from "next/link";
import { Pencil, Plus, Trash2, UserCheck, UserX } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { canManageGuidance, canViewGuidance } from "@/lib/guidance/permissions";
import { getActivityById } from "@/lib/guidance/queries";
import { updateActivityAction, addActivityParticipantsAction, removeActivityParticipantAction, deleteActivityAction } from "@/lib/guidance/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { cn } from "@/lib/utils";

const typeLabels: Record<string, string> = { trip: "Gezi", seminar: "Seminer", meeting: "Toplantı", sports: "Spor", cultural: "Kültürel", activity: "Aktivite" };
const statusLabels: Record<string, string> = { planned: "Planlandı", completed: "Tamamlandı", cancelled: "İptal" };
const statusColors: Record<string, "default" | "secondary" | "destructive"> = { planned: "secondary", completed: "default", cancelled: "destructive" };

export default async function EtkinlikDetayPage({ params }: { params: Promise<{ id: string }> }) {
  const { profile } = await requireAuth();
  const { id } = await params;

  if (!canViewGuidance(profile)) {
    return <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Bu sayfaya erişim yetkiniz bulunmamaktadır.</div>;
  }

  const activity = await getActivityById(id);
  if (!activity) notFound();

  const canManage = await canManageGuidance(profile);
  const supabase = await createSupabaseServerClient();
  const [{ data: students }] = await Promise.all([
    supabase.from("students").select("id, full_name").eq("status", "active").order("full_name"),
    supabase.from("profiles").select("id, full_name").eq("is_active", true).order("full_name"),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Rehberlik" title={activity.title} description={activity.description ?? ""} actions={canManage ? <div className="flex gap-2"><Link href={`/rehberlik/etkinlikler/${id}/duzenle`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}><Pencil className="mr-1.5 size-4" /> Düzenle</Link><form action={deleteActivityAction.bind(null, id) as unknown as (formData: FormData) => void}><FormSubmitButton variant="destructive" size="sm"><Trash2 className="mr-1.5 size-4" /> Sil</FormSubmitButton></form></div> : undefined} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground font-medium">Tür</CardTitle></CardHeader><CardContent><Badge variant="secondary">{typeLabels[activity.activity_type] ?? activity.activity_type}</Badge></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground font-medium">Durum</CardTitle></CardHeader><CardContent><Badge variant={statusColors[activity.status] ?? "outline"}>{statusLabels[activity.status] ?? activity.status}</Badge></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground font-medium">Tarih</CardTitle></CardHeader><CardContent><p className="text-sm font-medium">{activity.activity_date}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground font-medium">Yer</CardTitle></CardHeader><CardContent><p className="text-sm font-medium">{activity.location ?? "—"}</p></CardContent></Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Detay Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div><p className="text-xs text-muted-foreground">Sorumlu</p><p className="text-sm font-medium">{activity.responsible_profile?.full_name ?? "—"}</p></div>
            {activity.start_time && <div><p className="text-xs text-muted-foreground">Başlangıç</p><p className="text-sm">{activity.start_time}</p></div>}
            {activity.end_time && <div><p className="text-xs text-muted-foreground">Bitiş</p><p className="text-sm">{activity.end_time}</p></div>}
            {activity.description && <div><p className="text-xs text-muted-foreground">Açıklama</p><p className="text-sm whitespace-pre-wrap">{activity.description}</p></div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Katılımcılar ({activity.participants.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {activity.participants.length === 0 ? (
              <p className="text-sm text-muted-foreground">Henüz katılımcı eklenmemiş.</p>
            ) : (
              activity.participants.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">
                      {p.participant_type === "student" ? p.student?.full_name : p.profile?.full_name}
                    </p>
                    <p className="text-xs text-muted-foreground">{p.participant_type === "student" ? "Öğrenci" : "Personel"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={p.attendance_status === "attended" ? "default" : p.attendance_status === "absent" ? "destructive" : "secondary"}>
                      {p.attendance_status === "attended" ? "Katıldı" : p.attendance_status === "absent" ? "Katılmadı" : "Planlandı"}
                    </Badge>
                    {canManage && activity.status !== "completed" && (
                      <form action={removeActivityParticipantAction.bind(null, p.id) as unknown as (formData: FormData) => void}>
                        <FormSubmitButton className="text-muted-foreground hover:text-red-600"><Trash2 className="size-4" /></FormSubmitButton>
                      </form>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {canManage && activity.status === "planned" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Katılımcı Ekle</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={addActivityParticipantsAction.bind(null, activity.id) as unknown as (formData: FormData) => void} className="space-y-3">
              <label className="grid gap-1 text-xs font-medium">
                Katılımcı Türü
                <select name="participant_type" className="h-9 rounded-md border border-input bg-background px-2.5 text-sm outline-none focus:border-[#093657]">
                  <option value="student">Öğrenci</option>
                  <option value="profile">Personel</option>
                </select>
              </label>
              <div className="space-y-1 max-h-40 overflow-y-auto rounded-md border border-border p-2">
                {(students ?? []).map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-sm py-0.5">
                    <input type="checkbox" name="student_ids" value={s.id} className="size-4 rounded border-border text-[#093657]" />
                    {s.full_name}
                  </label>
                ))}
              </div>
              <FormSubmitButton size="sm">
                <Plus className="mr-1.5 size-4" /> Katılımcıları Ekle
              </FormSubmitButton>
              <input type="hidden" name="participant_type" value="student" />
            </form>
          </CardContent>
        </Card>
      )}

      {canManage && activity.status === "planned" && (
        <div className="flex gap-3">
          <form action={updateActivityAction.bind(null, undefined) as unknown as (formData: FormData) => void}>
            <input type="hidden" name="id" value={activity.id} />
            <input type="hidden" name="title" value={activity.title} />
            <input type="hidden" name="activity_type" value={activity.activity_type} />
            <input type="hidden" name="activity_date" value={activity.activity_date} />
            <input type="hidden" name="status" value="completed" />
            <input type="hidden" name="description" value={activity.description ?? ""} />
            <input type="hidden" name="location" value={activity.location ?? ""} />
            <input type="hidden" name="start_time" value={activity.start_time ?? ""} />
            <input type="hidden" name="end_time" value={activity.end_time ?? ""} />
            <input type="hidden" name="responsible_profile_id" value={activity.responsible_profile_id ?? ""} />
            <FormSubmitButton variant="default">
              <UserCheck className="mr-1.5 size-4" /> Tamamlandı Olarak İşaretle
            </FormSubmitButton>
          </form>
          <form action={updateActivityAction.bind(null, undefined) as unknown as (formData: FormData) => void}>
            <input type="hidden" name="id" value={activity.id} />
            <input type="hidden" name="title" value={activity.title} />
            <input type="hidden" name="activity_type" value={activity.activity_type} />
            <input type="hidden" name="activity_date" value={activity.activity_date} />
            <input type="hidden" name="status" value="cancelled" />
            <input type="hidden" name="description" value={activity.description ?? ""} />
            <input type="hidden" name="location" value={activity.location ?? ""} />
            <input type="hidden" name="start_time" value={activity.start_time ?? ""} />
            <input type="hidden" name="end_time" value={activity.end_time ?? ""} />
            <input type="hidden" name="responsible_profile_id" value={activity.responsible_profile_id ?? ""} />
            <FormSubmitButton variant="destructive">
              <UserX className="mr-1.5 size-4" /> İptal Et
            </FormSubmitButton>
          </form>
        </div>
      )}
    </div>
  );
}
