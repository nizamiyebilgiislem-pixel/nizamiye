"use client";

import { useMemo, useState } from "react";

import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createAttendanceSessionAction } from "@/lib/attendance/actions";
import { attendanceTypeDescriptions, attendanceTypeLabels } from "@/lib/attendance/constants";
import type { AttendanceType, ClassRow } from "@/types/database";

type AttendanceSessionCreateFormProps = {
  classes: ClassRow[];
  defaultAttendanceType?: AttendanceType;
  defaultDate?: string;
  defaultClassId?: string;
  bulkDepartmentId?: string;
  bulkDepartmentName?: string;
};

export function AttendanceSessionCreateForm({
  classes,
  defaultAttendanceType = "daily",
  defaultDate,
  defaultClassId,
  bulkDepartmentId,
  bulkDepartmentName,
}: AttendanceSessionCreateFormProps) {
  const [attendanceType, setAttendanceType] = useState<AttendanceType>(defaultAttendanceType);
  const title = useMemo(() => attendanceTypeLabels[attendanceType], [attendanceType]);
  const isDepartmentBulk = Boolean(bulkDepartmentId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title} Yoklamasi</CardTitle>
        <p className="text-sm text-muted-foreground">{attendanceTypeDescriptions[attendanceType]}</p>
        {isDepartmentBulk ? (
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>Yoklama kapsami:</span>
            <Badge variant="secondary">{bulkDepartmentName ?? "Bolum"}</Badge>
            <span>Tum aktif talebeler tek ekranda listelenir.</span>
          </div>
        ) : null}
      </CardHeader>
      <CardContent>
        <form action={createAttendanceSessionAction} className="space-y-4">
          <input type="hidden" name="scope" value={isDepartmentBulk ? "department" : "class"} />
          {isDepartmentBulk ? <input type="hidden" name="department_id" value={bulkDepartmentId} /> : null}
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tarih</label>
              <Input name="attendance_date" type="date" defaultValue={defaultDate} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Yoklama Turu</label>
              <select
                name="attendance_type"
                defaultValue={defaultAttendanceType}
                onChange={(event) => setAttendanceType(event.target.value as AttendanceType)}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
              >
                {Object.entries(attendanceTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            {isDepartmentBulk ? (
              <div className="space-y-2">
                <label className="text-sm font-medium">Kapsam</label>
                <div className="flex h-10 items-center rounded-md border border-border bg-muted/30 px-3 text-sm text-muted-foreground">
                  {bulkDepartmentName ?? "Bolum"} - tum siniflar
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-medium">Sinif</label>
                <select
                  name="class_id"
                  defaultValue={defaultClassId ?? classes[0]?.id ?? ""}
                  required
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                >
                  {classes.map((classRow) => (
                    <option key={classRow.id} value={classRow.id}>
                      {classRow.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <Textarea name="note" placeholder="Istege bagli aciklama" className="min-h-24" />
          <div className="flex justify-end">
            <FormSubmitButton pendingLabel="Kaydediliyor...">
              {isDepartmentBulk ? "Bolum Yoklamasini Baslat" : "Yoklama Olustur"}
            </FormSubmitButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
