"use client";

import { useActionState } from "react";

import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { NativeSelect } from "@/components/ui/native-select";
import { batchUpdateStudentStatusAction } from "@/lib/students/actions";

type StudentBatchActionsProps = {
  selectedIds: string[];
  onClear: () => void;
};

export function StudentBatchActions({ selectedIds, onClear }: StudentBatchActionsProps) {
  const [state, formAction] = useActionState(batchUpdateStudentStatusAction, undefined);

  if (selectedIds.length === 0) return null;

  return (
    <div className="flex items-center gap-3 rounded-md border border-border bg-[#f8fafc] px-4 py-2">
      <span className="text-sm text-muted-foreground">
        {selectedIds.length} öğrenci seçildi
      </span>
      <form action={formAction} className="flex items-center gap-2">
        <input type="hidden" name="student_ids" value={JSON.stringify(selectedIds)} />
        <NativeSelect name="status" className="h-8 text-xs">
          <option value="active">Aktif</option>
          <option value="passive">Pasif</option>
          <option value="graduated">Mezun</option>
          <option value="left">Ayrıldı</option>
        </NativeSelect>
        <FormSubmitButton size="sm" pendingLabel="Güncelleniyor...">
          Uygula
        </FormSubmitButton>
      </form>
      <button
        type="button"
        onClick={onClear}
        className="text-xs text-muted-foreground hover:text-red-600"
      >
        İptal
      </button>
      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
      {state?.success && <p className="text-xs text-green-600">Güncellendi.</p>}
    </div>
  );
}
