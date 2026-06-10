"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, Download, Eye, Pencil, Phone, Mail } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { canEditClass } from "@/lib/classes/permissions";
import type { ClassWithRelations } from "@/lib/classes/queries";
import { cn } from "@/lib/utils";
import type { ProfileRow } from "@/types/database";

type ClassListCardsProps = {
  classes: ClassWithRelations[];
  profile: ProfileRow;
};

export function ClassListTable({ classes, profile }: ClassListCardsProps) {
  return (
    <div className="space-y-3">
      {classes.map((classRow) => (
        <ClassCard key={classRow.id} classRow={classRow} profile={profile} />
      ))}
    </div>
  );
}

function ClassCard({ classRow, profile }: { classRow: ClassWithRelations; profile: ProfileRow }) {
  const [open, setOpen] = useState(false);

  return (
    <Card className={cn("bg-white transition-shadow", open && "shadow-md")}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link
              href={`/siniflar/${classRow.id}`}
              onClick={(e) => e.stopPropagation()}
              className="truncate text-base font-semibold text-[#093657] hover:underline"
            >
              {classRow.name}
            </Link>
            <Badge variant={classRow.is_active ? "default" : "outline"} className="shrink-0">
              {classRow.is_active ? "Aktif" : "Pasif"}
            </Badge>
          </div>
          <div className="mt-1 text-sm text-muted-foreground">{classRow.department?.name ?? "-"}</div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{classRow.active_student_count} öğrenci</span>
          <ChevronDown
            className={cn(
              "size-5 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          />
        </div>
      </button>

      <div className={cn("overflow-hidden transition-all", open ? "max-h-[2000px]" : "max-h-0")}>
        <div className="border-t border-border px-4 pb-4 pt-3">
          <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
            <div>
              {classRow.class_teacher ? (
                <div className="rounded-md border border-border bg-[#f8fafc] p-3">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Sınıf Hocası</p>
                  <Link
                    href={`/hocalar/${classRow.class_teacher.id}`}
                    className="text-sm font-semibold text-[#093657] hover:underline"
                  >
                    {classRow.class_teacher.full_name}
                  </Link>
                  <div className="mt-2 space-y-1">
                    {classRow.class_teacher.phone ? (
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Phone className="size-3" /> {classRow.class_teacher.phone}
                      </span>
                    ) : null}
                    {classRow.class_teacher.email ? (
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Mail className="size-3" /> {classRow.class_teacher.email}
                      </span>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="rounded-md border border-dashed border-border bg-[#f8fafc] p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Sınıf Hocası</p>
                  <p className="mt-1 text-sm font-medium text-muted-foreground">Atanmadı</p>
                </div>
              )}
              <div className="mt-3 flex items-center gap-2">
                <Link
                  href={`/siniflar/${classRow.id}`}
                  className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent"
                >
                  <Eye className="size-3.5" /> Detay
                </Link>
                {canEditClass(profile, classRow) ? (
                  <Link
                    href={`/siniflar/${classRow.id}/duzenle`}
                    className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent"
                  >
                    <Pencil className="size-3.5" /> Düzenle
                  </Link>
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Öğrenciler ({classRow.students.length})
                </p>
                <Link
                  href={`/siniflar/${classRow.id}/pdf`}
                  className="inline-flex h-7 items-center gap-1 rounded-md border border-border px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent"
                >
                  <Download className="size-3.5" /> PDF
                </Link>
              </div>
              <div className="max-h-64 space-y-1 overflow-y-auto">
                {classRow.students.length > 0 ? (
                  classRow.students.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between rounded-md bg-[#f8fafc] px-3 py-1.5 text-sm"
                    >
                      <span className="text-[#093657]">{student.full_name}</span>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {student.guardian_phone ? <span>{student.guardian_phone}</span> : null}
                        {student.guardian_phone_2 ? <span>{student.guardian_phone_2}</span> : null}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Bu sınıfta aktif öğrenci bulunmuyor.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
