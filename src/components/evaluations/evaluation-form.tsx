import { saveEvaluationAction } from "@/lib/evaluations/actions";
import type { AcademicTermRow, StudentEvaluationRow } from "@/types/database";

export function EvaluationForm({
  studentId,
  terms,
  selectedTermId,
  evaluation,
  readOnly = false,
}: {
  studentId: string;
  terms: AcademicTermRow[];
  selectedTermId: string;
  evaluation: StudentEvaluationRow | null;
  readOnly?: boolean;
}) {
  return (
    <form action={saveEvaluationAction} className="space-y-5">
      <input type="hidden" name="student_id" value={studentId} />
      {readOnly ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Bu dönem kapalı veya arşivli olduğu için kanaat düzenlenemez.
        </div>
      ) : null}
      <label className="grid max-w-sm gap-2 text-sm font-medium">
        Dönem
        <select name="term_id" defaultValue={selectedTermId} disabled={readOnly} className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal disabled:opacity-60">
          {terms.map((term) => (
            <option key={term.id} value={term.id}>
              {term.name}
            </option>
          ))}
        </select>
      </label>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <ScoreField label="Davranış Puanı" name="behavior_score" value={evaluation?.behavior_score} disabled={readOnly} />
        <ScoreField label="Devam Puanı" name="attendance_score" value={evaluation?.attendance_score} disabled={readOnly} />
        <ScoreField label="Ders Performansı Puanı" name="lesson_performance_score" value={evaluation?.lesson_performance_score} disabled={readOnly} />
        <ScoreField label="Disiplin Puanı" name="discipline_score" value={evaluation?.discipline_score} disabled={readOnly} />
        <ScoreField label="Ezber/Hafızlık Puanı" name="memorization_score" value={evaluation?.memorization_score} disabled={readOnly} />
      </div>
      <label className="grid gap-2 text-sm font-medium">
        Genel Kanaat / Açıklama
        <textarea
          name="general_opinion"
          rows={5}
          defaultValue={evaluation?.general_opinion ?? ""}
          disabled={readOnly}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm font-normal disabled:opacity-60"
        />
      </label>
      <div className="flex justify-end">
        <button type="submit" disabled={readOnly} className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60">
          Kanaati Kaydet
        </button>
      </div>
    </form>
  );
}

function ScoreField({ label, name, value, disabled }: { label: string; name: string; value?: number | null; disabled?: boolean }) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <input
        name={name}
        type="number"
        min="0"
        max="100"
        step="1"
        defaultValue={value ?? ""}
        disabled={disabled}
        className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal disabled:opacity-60"
      />
    </label>
  );
}
