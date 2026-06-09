"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { saveSurveyQuestionsAction } from "@/lib/guidance/actions";

type Question = {
  text: string;
  type: string;
  options: string;
  sort_order: number;
  is_required: boolean;
};

type SurveyQuestionEditorProps = {
  surveyId: string;
  questions: { id: string; question_text: string; question_type: string; options: unknown; sort_order: number; is_required: boolean }[];
};

export function SurveyQuestionEditor({ surveyId, questions: initialQuestions }: SurveyQuestionEditorProps) {
  const [questions, setQuestions] = useState<Question[]>(
    initialQuestions.length > 0
      ? initialQuestions.map((q) => ({
          text: q.question_text,
          type: q.question_type,
          options: q.question_type === "choice" ? (Array.isArray(q.options) ? (q.options as string[]).join(", ") : "") : "",
          sort_order: q.sort_order,
          is_required: q.is_required,
        }))
      : []
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const addQuestion = () => {
    setQuestions([...questions, { text: "", type: "scale", options: "", sort_order: questions.length, is_required: true }]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index).map((q, i) => ({ ...q, sort_order: i })));
  };

  const updateQuestion = (index: number, field: keyof Question, value: string | boolean) => {
    const updated = [...questions];
    (updated[index] as Record<string, unknown>)[field] = value;
    setQuestions(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    const formData = new FormData();
    formData.append("questions", JSON.stringify(questions));

    const result = await saveSurveyQuestionsAction(surveyId, formData);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess("Sorular kaydedildi.");
      router.refresh();
    }
    setSaving(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Anket Soruları</CardTitle>
        <CardDescription className="text-xs">Soruları düzenleyin ve kaydedin.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {questions.length === 0 && (
          <p className="text-sm text-muted-foreground">Henüz soru eklenmemiş.</p>
        )}

        {questions.map((q, i) => (
          <div key={i} className="rounded-lg border border-border p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 space-y-3">
                <label className="grid gap-1 text-xs font-medium">
                  Soru {i + 1}
                  <input
                    value={q.text}
                    onChange={(e) => updateQuestion(i, "text", e.target.value)}
                    placeholder="Soru metni"
                    className="h-9 rounded-md border border-input bg-background px-2.5 text-sm outline-none focus:border-[#093657]"
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="grid gap-1 text-xs font-medium">
                    Tip
                    <select value={q.type} onChange={(e) => updateQuestion(i, "type", e.target.value)} className="h-9 rounded-md border border-input bg-background px-2.5 text-sm outline-none focus:border-[#093657]">
                      <option value="scale">1-5 Ölçek</option>
                      <option value="choice">Çoktan Seçmeli</option>
                      <option value="yes_no">Evet/Hayır</option>
                      <option value="text">Kısa Metin</option>
                    </select>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium pt-1">
                    <input type="checkbox" checked={q.is_required} onChange={(e) => updateQuestion(i, "is_required", e.target.checked)} className="size-4 rounded border-border text-[#093657]" />
                    Zorunlu
                  </label>
                </div>
                {q.type === "choice" && (
                  <label className="grid gap-1 text-xs font-medium">
                    Seçenekler (virgülle ayırın)
                    <input
                      value={q.options}
                      onChange={(e) => updateQuestion(i, "options", e.target.value)}
                      placeholder="Seçenek 1, Seçenek 2, Seçenek 3"
                      className="h-9 rounded-md border border-input bg-background px-2.5 text-sm outline-none focus:border-[#093657]"
                    />
                  </label>
                )}
              </div>
              <button type="button" onClick={() => removeQuestion(i)} className="mt-1 shrink-0 text-muted-foreground hover:text-red-600">
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        ))}

        <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
          <Plus className="mr-1.5 size-4" /> Soru Ekle
        </Button>

        {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        {success && <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{success}</div>}

        {questions.length > 0 && (
          <div className="flex gap-3">
            <Button type="button" onClick={handleSave} disabled={saving}>
              {saving ? "Kaydediliyor..." : "Soruları Kaydet"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
