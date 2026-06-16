import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { saveEvaluationAction } from "@/lib/evaluations/actions";
import type { AcademicTermRow, HafizlikProgressRow, StudentEvaluationRow } from "@/types/database";
import { cn } from "@/lib/utils";

export function EvaluationForm({
  studentId,
  terms,
  selectedTermId,
  evaluation,
  readOnly = false,
  hafizlikProgress,
}: {
  studentId: string;
  terms: AcademicTermRow[];
  selectedTermId: string;
  evaluation: StudentEvaluationRow | null;
  readOnly?: boolean;
  hafizlikProgress?: HafizlikProgressRow | null;
}) {
  const hafizlikPercentage = hafizlikProgress
    ? Math.round(((hafizlikProgress.current_juz - 1) * 604 + hafizlikProgress.current_page) / 604 * 100)
    : null;

  const suggestedMemorization = hafizlikPercentage !== null ? hafizlikPercentage : null;

  return (
    <form action={saveEvaluationAction} className="space-y-5">
      <input type="hidden" name="student_id" value={studentId} />
      {readOnly ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Bu dönem kapalı veya arşivli olduğu için kanaat düzenlenemez.
        </div>
      ) : null}

      {hafizlikProgress && (
        <div className="rounded-md border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900">Hafızlık Durumu</p>
              <p className="text-sm text-blue-700">
                {hafizlikProgress.current_juz}. Cüz · Sayfa {hafizlikProgress.current_page} ({hafizlikPercentage}% tamamlandı)
              </p>
            </div>
            <span className={cn(
              "rounded-full px-3 py-1 text-xs font-medium",
              hafizlikProgress.status === "completed" ? "bg-green-100 text-green-800" :
              hafizlikProgress.status === "reviewing" ? "bg-yellow-100 text-yellow-800" :
              "bg-blue-100 text-blue-800"
            )}>
              {hafizlikProgress.status === "learning" ? "Öğreniyor" :
               hafizlikProgress.status === "reviewing" ? "Tekrar" : "Tamamlandı"}
            </span>
          </div>
          {hafizlikProgress.target_completion_date && (
            <p className="mt-1 text-xs text-blue-600">
              Hedef: {new Date(hafizlikProgress.target_completion_date).toLocaleDateString("tr-TR")}
            </p>
          )}
        </div>
      )}

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
        <ScoreFieldWithSuggestion
          label="Ezber/Hafızlık Puanı"
          name="memorization_score"
          value={evaluation?.memorization_score}
          suggestedValue={!evaluation?.memorization_score && suggestedMemorization !== null ? suggestedMemorization : undefined}
          disabled={readOnly}
        />
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
        {!readOnly ? <FormSubmitButton pendingLabel="Kaydediliyor...">Kanaati Kaydet</FormSubmitButton> : null}
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

function ScoreFieldWithSuggestion({ label, name, value, suggestedValue, disabled }: { label: string; name: string; value?: number | null; suggestedValue?: number; disabled?: boolean }) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <div className="relative">
        <input
          name={name}
          type="number"
          min="0"
          max="100"
          step="1"
          defaultValue={value ?? ""}
          disabled={disabled}
          className="h-10 w-full rounded-md border border-input bg-background px-3 pr-16 text-sm font-normal disabled:opacity-60"
        />
        {suggestedValue !== undefined && !value && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blue-600">
            Öneri: {suggestedValue}
          </span>
        )}
      </div>
    </label>
  );
}