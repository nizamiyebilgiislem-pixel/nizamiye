"use client";

import { useState } from "react";
import { FileText, Pencil, Save } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { HafizlikProgressRow } from "@/types/database";

const JuzOptions = Array.from({ length: 30 }, (_, i) => i + 1);

const statusLabels: Record<HafizlikProgressRow["status"], string> = {
  learning: "Öğreniyor",
  reviewing: "Tekrar",
  completed: "Tamamlandı",
};

const statusColors: Record<HafizlikProgressRow["status"], string> = {
  learning: "bg-blue-100 text-blue-800",
  reviewing: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
};

export function HafizlikProgressPanel({
  studentId,
  progress,
  canEdit,
  updateAction,
}: {
  studentId: string;
  progress: HafizlikProgressRow | null;
  canEdit: boolean;
  updateAction: (formData: FormData) => void | Promise<void>;
}) {
  const [editing, setEditing] = useState(false);

  if (!canEdit && !progress) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Hafızlık Takibi</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Hafızlık kaydı bulunamadı.</p>
        </CardContent>
      </Card>
    );
  }

  if (editing) {
    return (
      <Card>
        <CardHeader className="gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Hafızlık Takibi</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Cüz ve sayfa bazlı hafızlık ilerlemesi.</p>
          </div>
          <button onClick={() => setEditing(false)} className={buttonVariants({ variant: "outline" })}>
            İptal
          </button>
        </CardHeader>
        <CardContent>
          <form action={updateAction} className="space-y-4">
            <input type="hidden" name="student_id" value={studentId} />
            <input type="hidden" name="current_juz" value={progress?.current_juz ?? 1} />
            <input type="hidden" name="current_page" value={progress?.current_page ?? 1} />
            <input type="hidden" name="status" value={progress?.status ?? "learning"} />
            <input type="hidden" name="target_completion_date" value={progress?.target_completion_date ?? ""} />
            <input type="hidden" name="teacher_note" value={progress?.teacher_note ?? ""} />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit_juz">Cüz</Label>
                <select
                  id="edit_juz"
                  name="current_juz"
                  defaultValue={progress?.current_juz ?? 1}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {JuzOptions.map((j) => (
                    <option key={j} value={j}>
                      {j}. Cüz
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_page">Sayfa</Label>
                <input
                  id="edit_page"
                  name="current_page"
                  type="number"
                  min="1"
                  max="604"
                  defaultValue={progress?.current_page ?? 1}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_status">Durum</Label>
                <select
                  id="edit_status"
                  name="status"
                  defaultValue={progress?.status ?? "learning"}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="learning">Öğreniyor</option>
                  <option value="reviewing">Tekrar</option>
                  <option value="completed">Tamamlandı</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_target">Hedef Tarih</Label>
                <Input
                  id="edit_target"
                  name="target_completion_date"
                  type="date"
                  defaultValue={progress?.target_completion_date ?? ""}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_note">Hoca Notu</Label>
              <textarea
                id="edit_note"
                name="teacher_note"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                defaultValue={progress?.teacher_note ?? ""}
                placeholder="Öğrenci hakkında not..."
              />
            </div>
            <div className="flex justify-end">
              <FormSubmitButton pendingLabel="Kaydediliyor...">Kaydet</FormSubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  const progressPercentage = progress
    ? Math.round(((progress.current_juz - 1) * 604 + progress.current_page) / 604 * 100)
    : 0;

  return (
    <Card>
      <CardHeader className="gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>Hafızlık Takibi</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">Cüz ve sayfa bazlı hafızlık ilerlemesi.</p>
        </div>
        <div className="flex gap-2">
          {progress && (
            <Link
              href={`/talebeler/${studentId}/hafizlik/pdf`}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <FileText className="mr-2 size-4" />
              PDF
            </Link>
          )}
          {canEdit && (
            <button onClick={() => setEditing(true)} className={buttonVariants({ variant: "outline", size: "sm" })}>
              <Pencil className="mr-2 size-4" />
              {progress ? "Düzenle" : "Başlat"}
            </button>
          )}
          {canEdit && progress && (
            <Link
              href={`/kanaat-sistemi/kanaat-girisi/${studentId}`}
              className={buttonVariants({ variant: "default", size: "sm" })}
            >
              Kanaat Güncelle
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {progress ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between text-sm">
                  <span>
                    {progress.current_juz}. Cüz · Sayfa {progress.current_page}
                  </span>
                  <span className="font-medium">{progressPercentage}%</span>
                </div>
                <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[progress.status]}`}>
                {statusLabels[progress.status]}
              </span>
            </div>
            {progress.target_completion_date && (
              <p className="text-sm text-muted-foreground">
                Hedef: {new Date(progress.target_completion_date).toLocaleDateString("tr-TR")}
              </p>
            )}
            {progress.teacher_note && (
              <div className="rounded-md border border-border bg-muted/50 p-3">
                <p className="text-sm">{progress.teacher_note}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Hafızlık kaydı başlatılmamış.
          </p>
        )}
      </CardContent>
    </Card>
  );
}