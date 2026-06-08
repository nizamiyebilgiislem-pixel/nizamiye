"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { attendanceTypeDescriptions, attendanceTypeLabels } from "@/lib/attendance/constants";
import { createAttendanceSessionAction } from "@/lib/attendance/actions";
import type { AttendanceType, ClassRow } from "@/types/database";

type AttendanceSessionCreateFormProps = {
  classes: ClassRow[];
  defaultAttendanceType?: AttendanceType;
  defaultDate?: string;
  defaultClassId?: string;
};

export function AttendanceSessionCreateForm({
  classes,
  defaultAttendanceType = "daily",
  defaultDate,
  defaultClassId,
}: AttendanceSessionCreateFormProps) {
  const [attendanceType, setAttendanceType] = useState<AttendanceType>(defaultAttendanceType);
  const title = useMemo(() => attendanceTypeLabels[attendanceType], [attendanceType]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title} Yoklaması</CardTitle>
        <p className="text-sm text-muted-foreground">{attendanceTypeDescriptions[attendanceType]}</p>
      </CardHeader>
      <CardContent>
        <form action={createAttendanceSessionAction} className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tarih</label>
              <Input name="attendance_date" type="date" defaultValue={defaultDate} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Yoklama Türü</label>
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
            <div className="space-y-2">
              <label className="text-sm font-medium">Sınıf</label>
              <select name="class_id" defaultValue={defaultClassId ?? classes[0]?.id ?? ""} required className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm">
                {classes.map((classRow) => (
                  <option key={classRow.id} value={classRow.id}>
                    {classRow.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Textarea name="note" placeholder="İsteğe bağlı açıklama" className="min-h-24" />
          <div className="flex justify-end">
            <Button type="submit">Yoklama Oluştur</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
