import { HeartHandshake, ClipboardList, CalendarCheck } from "lucide-react";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getStudentInterviews, getStudentFollowUps, getStudentActivities } from "@/lib/guidance/queries";
import { canViewGuidance, canViewPrivateNotes } from "@/lib/guidance/permissions";
import type { ProfileRow } from "@/types/database";

type StudentGuidancePanelProps = {
  studentId: string;
  profile: ProfileRow;
};

const interviewTypeLabels: Record<string, string> = {
  individual: "Bireysel",
  group: "Grup",
  parent: "Veli",
  emergency: "Acil",
  follow_up: "Takip",
};

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  open: { label: "Açık", variant: "default" },
  followed: { label: "Takip Ediliyor", variant: "secondary" },
  closed: { label: "Kapalı", variant: "outline" },
  planned: { label: "Planlandı", variant: "secondary" },
  completed: { label: "Tamamlandı", variant: "default" },
  cancelled: { label: "İptal", variant: "destructive" },
};

export async function StudentGuidancePanel({ studentId, profile }: StudentGuidancePanelProps) {
  if (!canViewGuidance(profile)) {
    return <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Bu bölüme erişim yetkiniz bulunmamaktadır.</div>;
  }

  const [interviews, followUps, activities] = await Promise.all([
    getStudentInterviews(studentId, profile),
    getStudentFollowUps(studentId, profile),
    getStudentActivities(studentId, profile),
  ]);

  const canViewPrivate = await canViewPrivateNotes(profile);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <HeartHandshake className="size-5 text-[#093657]" />
          Rehberlik Bilgileri
        </h3>
        {canViewPrivate && (
          <Link
            href={`/rehberlik/gorusmeler/yeni?student_id=${studentId}`}
            className="rounded-md bg-[#093657] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#093657]/90"
          >
            Yeni Görüşme
          </Link>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Görüşme Geçmişi</CardTitle>
          <CardDescription className="text-xs">{interviews.length} görüşme</CardDescription>
        </CardHeader>
        <CardContent>
          {interviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">Henüz görüşme kaydı bulunmuyor.</p>
          ) : (
            <div className="space-y-3">
              {interviews.map((interview) => {
                const statusInfo = statusLabels[interview.status] ?? { label: interview.status, variant: "outline" };
                return (
                  <div key={interview.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{interview.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {interview.interview_date} — {interviewTypeLabels[interview.interview_type] ?? interview.interview_type}
                          {interview.counselor && ` — ${interview.counselor.full_name}`}
                        </p>
                      </div>
                      <Badge variant={statusInfo.variant as "default" | "secondary" | "outline" | "destructive"} className="shrink-0">
                        {statusInfo.label}
                      </Badge>
                    </div>
                    {interview.summary && (
                      <p className="mt-2 text-sm text-muted-foreground">{interview.summary}</p>
                    )}
                    {interview.private_notes && canViewPrivate && (
                      <div className="mt-2 rounded-md bg-amber-50 px-2 py-1.5 text-xs text-amber-800">
                        <span className="font-medium">Özel Not:</span> {interview.private_notes}
                      </div>
                    )}
                    {canViewPrivate && (
                      <Link href={`/rehberlik/gorusmeler/${interview.id}`} className="mt-2 inline-block text-xs font-medium text-[#093657] hover:underline">
                        Detay →
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <ClipboardList className="size-4 text-[#093657]" />
              Takip Planları
            </CardTitle>
            <CardDescription className="text-xs">{followUps.length} takip</CardDescription>
          </CardHeader>
          <CardContent>
            {followUps.length === 0 ? (
              <p className="text-sm text-muted-foreground">Henüz takip planı bulunmuyor.</p>
            ) : (
              <div className="space-y-2">
                {followUps.slice(0, 5).map((fu) => {
                  const st = statusLabels[fu.status] ?? { label: fu.status, variant: "outline" };
                  return (
                    <div key={fu.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                      <div>
                        <p className="text-sm font-medium">{fu.title}</p>
                        <p className="text-xs text-muted-foreground">{fu.follow_up_date}</p>
                      </div>
                      <Badge variant={st.variant}>
                        {st.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <CalendarCheck className="size-4 text-[#093657]" />
              Katıldığı Etkinlikler
            </CardTitle>
            <CardDescription className="text-xs">{activities.length} etkinlik</CardDescription>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground">Henüz etkinlik kaydı bulunmuyor.</p>
            ) : (
              <div className="space-y-2">
                {activities.slice(0, 5).map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{a.title}</p>
                      <p className="text-xs text-muted-foreground">{a.activity_date}</p>
                    </div>
                    <Badge variant={a.status === "completed" ? "default" : a.status === "cancelled" ? "destructive" : "secondary"}>
                      {a.status === "planned" ? "Planlandı" : a.status === "completed" ? "Tamamlandı" : "İptal"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
