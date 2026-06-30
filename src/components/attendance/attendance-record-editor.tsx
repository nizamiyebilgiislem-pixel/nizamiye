import { AttendanceStatusBadge, AttendanceTypeBadge } from "@/components/attendance/attendance-badges";
import { AttendanceBulkActions } from "@/components/attendance/attendance-bulk-actions";
import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { StudentAvatar } from "@/components/students/student-avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateAttendanceSessionAction } from "@/lib/attendance/actions";
import { attendanceRecordStatusLabelsByType, attendanceTypeDescriptions, attendanceTypeLabels } from "@/lib/attendance/constants";
import type { AttendanceSessionDetail } from "@/lib/attendance/queries";

export function AttendanceRecordEditor({ detail, canEdit }: { detail: AttendanceSessionDetail; canEdit: boolean }) {
  const { session, records } = detail;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex flex-wrap items-center gap-2">
              {attendanceTypeLabels[session.attendance_type]}
              <AttendanceTypeBadge type={session.attendance_type} />
              <AttendanceStatusBadge status={session.completion_status} />
            </CardTitle>
            <p className="text-sm text-muted-foreground">{attendanceTypeDescriptions[session.attendance_type]}</p>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <p>{formatDate(session.attendance_date)}</p>
            <p>{session.course_class?.name ?? "-"}</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-4">
            <Stat label="Var" value={session.present_count} />
            <Stat label="Yok" value={session.absent_count} />
            <Stat label="İzinli" value={session.excused_count} />
            <Stat label="Geç" value={session.late_count} />
          </div>
          <div className="rounded-md border border-border bg-[#f8fafc] p-3 text-sm text-muted-foreground">
            Yoklamayı alan: <span className="font-medium text-foreground">{session.taken_by_profile?.full_name ?? "-"}</span>
          </div>
          {session.note ? (
            <div className="rounded-md border border-border bg-white p-3 text-sm leading-6 text-muted-foreground">{session.note}</div>
          ) : null}
        </CardContent>
      </Card>

      <form action={updateAttendanceSessionAction} className="space-y-4">
        <input type="hidden" name="session_id" value={session.id} />

        <Card>
          <CardHeader>
            <CardTitle>Oturum Notu</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea name="session_note" defaultValue={session.note ?? ""} disabled={!canEdit} placeholder="Bu yoklama için kısa not" className="min-h-24" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>Öğrenci Durumları</CardTitle>
              {canEdit ? (
                <AttendanceBulkActions
                  allowedStatuses={Object.keys(attendanceRecordStatusLabelsByType[session.attendance_type])}
                />
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {records.map((record) => (
              <div key={record.id} data-attendance-row="true" className="rounded-md border border-border bg-[#f8fafc] p-3">
                <input type="hidden" name="record_id" value={record.id} />
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex items-start gap-3">
                    <StudentAvatar name={record.student?.full_name ?? "Talebe"} photoUrl={record.student?.photo_url ?? null} size="sm" />
                    <div className="min-w-0">
                      <p className="font-medium text-[#093657]">{record.student?.full_name ?? "-"}</p>
                      <p className="text-xs text-muted-foreground">{record.student?.school_class ?? "-"}</p>
                    </div>
                  </div>
                  <div className="grid gap-2 md:min-w-[360px] md:grid-cols-[140px_minmax(0,1fr)]">
                    <select
                      data-attendance-status="true"
                      name={`status_${record.id}`}
                      defaultValue={record.status}
                      disabled={!canEdit}
                      className="h-9 rounded-md border border-border bg-background px-3 text-sm"
                    >
                      {Object.entries(attendanceRecordStatusLabelsByType[session.attendance_type]).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <Input
                      name={`note_${record.id}`}
                      defaultValue={record.note ?? ""}
                      disabled={!canEdit}
                      placeholder="Not"
                    />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <AttendanceStatusBadge status={record.status} type={session.attendance_type} />
                  {record.note ? <Badge variant="outline">{record.note}</Badge> : null}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {canEdit ? (
          <div className="flex justify-end">
            <FormSubmitButton pendingLabel="Kaydediliyor...">Kaydet</FormSubmitButton>
          </div>
        ) : null}
      </form>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-[#f8fafc] p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-[#093657]">{value}</p>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(new Date(value));
}
