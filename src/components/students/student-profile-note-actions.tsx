"use client";

import { PencilLine, Trash2 } from "lucide-react";

import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateStudentProfileNoteAction, deleteStudentProfileNoteAction } from "@/lib/student-profile/actions";
import type { StudentProfileNoteWithRelations } from "@/lib/student-profile/queries";

export function StudentProfileNoteActions({
  studentId,
  note,
  terms,
}: {
  studentId: string;
  note: StudentProfileNoteWithRelations;
  terms: Array<{ id: string; name: string; is_active: boolean }>;
}) {
  return (
    <div className="student-profile-print-hidden mt-3 space-y-3 border-t border-border pt-3">
      <details className="rounded-md border border-border bg-white p-3">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-medium text-[#093657]">
          <span className="inline-flex items-center gap-2">
            <PencilLine className="size-4" aria-hidden />
            Yorumu düzenle
          </span>
        </summary>
        <form action={updateStudentProfileNoteAction} className="mt-3 space-y-3">
          <input type="hidden" name="student_id" value={studentId} />
          <input type="hidden" name="note_id" value={note.id} />
          <div className="grid gap-3 sm:grid-cols-[180px_minmax(0,1fr)]">
            <select name="term_id" defaultValue={note.term_id ?? ""} className="h-9 rounded-md border border-border bg-background px-3 text-sm">
              <option value="">Dönem yok</option>
              {terms.map((term) => (
                <option key={term.id} value={term.id}>
                  {term.name}
                </option>
              ))}
            </select>
            <Textarea name="note" required minLength={3} defaultValue={note.note} className="min-h-20" />
          </div>
          <div className="flex items-center justify-end gap-2">
            <FormSubmitButton pendingLabel="Güncelleniyor..." size="sm">
              Kaydet
            </FormSubmitButton>
          </div>
        </form>
      </details>

      <form
        action={deleteStudentProfileNoteAction}
        className="flex justify-end"
        onSubmit={(event) => {
          if (!window.confirm("Bu yorumu silmek istiyor musunuz?")) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="student_id" value={studentId} />
        <input type="hidden" name="note_id" value={note.id} />
        <Button type="submit" variant="destructive" size="sm">
          <Trash2 className="size-4" aria-hidden />
          Sil
        </Button>
      </form>
    </div>
  );
}
