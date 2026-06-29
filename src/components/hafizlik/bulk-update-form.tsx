"use client";

import { useState } from "react";

import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { HafizlikProgressRow } from "@/types/database";

const JuzOptions = Array.from({ length: 30 }, (_, i) => i + 1);
const statusLabels = {
  learning: "Öğreniyor",
  reviewing: "Tekrar",
  completed: "Tamamlandı",
};

export function BulkUpdateForm({
  students,
  departmentId,
  updateAction,
}: {
  students: Array<{
    id: string;
    full_name: string;
    course_class: { name: string } | null;
    progress: HafizlikProgressRow | null;
    teacherName: string | null;
  }>;
  departmentId: string;
  updateAction: (formData: FormData) => void | Promise<void>;
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedIds(new Set(students.map((s) => s.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggle = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedIds(newSet);
    setSelectAll(newSet.size === students.length);
  };

  return (
    <form action={updateAction} className="space-y-6">
      <input type="hidden" name="department_id" value={departmentId} />
      {selectedIds.size > 0 && (
        <div className="rounded-md border border-primary/40 bg-primary/10 px-4 py-2 text-sm">
          {selectedIds.size} öğrenci seçildi
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="bulk_juz">Cüz</Label>
          <select
            id="bulk_juz"
            name="current_juz"
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
          <Label htmlFor="bulk_page">Sayfa</Label>
          <Input
            id="bulk_page"
            name="current_page"
            type="number"
            min="1"
            max="604"
            defaultValue="1"
            className="h-10"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bulk_status">Durum</Label>
          <select
            id="bulk_status"
            name="status"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="learning">Öğreniyor</option>
            <option value="reviewing">Tekrar</option>
            <option value="completed">Tamamlandı</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="bulk_target">Hedef Tarih (Opsiyonel)</Label>
          <Input
            id="bulk_target"
            name="target_completion_date"
            type="date"
            className="h-10"
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="bulk_note">Hoca Notu (Opsiyonel)</Label>
          <Input
            id="bulk_note"
            name="teacher_note"
            placeholder="Tüm seçili öğrencilere uygulanacak not..."
            className="h-10"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-3">
          <input
            type="checkbox"
            id="select_all"
            checked={selectAll}
            onChange={(e) => handleSelectAll(e.target.checked)}
            className="size-4 rounded border-input"
          />
          <label htmlFor="select_all" className="text-sm font-medium">
            Tümünü Seç
          </label>
        </div>
        <div className="divide-y">
          {students.map((student) => {
            const percentage = student.progress
              ? Math.round(((student.progress.current_juz - 1) * 604 + student.progress.current_page) / 604 * 100)
              : 0;
            return (
              <div key={student.id} className="flex items-center gap-4 px-4 py-3">
                <input
                  type="checkbox"
                  id={`student_${student.id}`}
                  name="student_ids"
                  value={student.id}
                  checked={selectedIds.has(student.id)}
                  onChange={(e) => handleToggle(student.id, e.target.checked)}
                  className="size-4 rounded border-input"
                />
                <label htmlFor={`student_${student.id}`} className="flex-1">
                  <div className="font-medium">{student.full_name}</div>
                  <div className="text-sm text-muted-foreground">
                    {student.course_class?.name ?? "Sınıf yok"} · {student.teacherName ?? "Hoca yok"}
                  </div>
                </label>
                <div className="w-32">
                  {student.progress ? (
                    <div>
                      <div className="flex justify-between text-xs">
                        <span>{student.progress.current_juz}. Cüz</span>
                        <span>{percentage}%</span>
                      </div>
                      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Kayıt yok</span>
                  )}
                </div>
                <span className={cn(
                  "rounded-full px-2 py-1 text-xs",
                  student.progress?.status === "completed" && "bg-green-100 text-green-800",
                  student.progress?.status === "reviewing" && "bg-yellow-100 text-yellow-800",
                  student.progress?.status === "learning" && "bg-blue-100 text-blue-800",
                  !student.progress && "bg-gray-100 text-gray-800"
                )}>
                  {student.progress ? statusLabels[student.progress.status] : "Yok"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end">
        <FormSubmitButton
          pendingLabel="Güncelleniyor..."
        >
          {selectedIds.size > 0 ? `${selectedIds.size} Öğrenciyi Güncelle` : "Öğrenci Seçin"}
        </FormSubmitButton>
      </div>
    </form>
  );
}
