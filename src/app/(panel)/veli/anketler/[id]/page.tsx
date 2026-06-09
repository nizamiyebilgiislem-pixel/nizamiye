import { notFound } from "next/navigation";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSurveyById, getParentStudentIds } from "@/lib/guidance/queries";
import { submitSurveyResponseAsParentAction } from "@/lib/guidance/actions";
import { cn } from "@/lib/utils";

const typeLabels: Record<string, string> = {
  scale: "1-5 Ölçek",
  choice: "Çoktan Seçmeli",
  yes_no: "Evet/Hayır",
  text: "Kısa Metin",
};

export default async function VeliAnketPage({ params }: { params: Promise<{ id: string }> }) {
  const { profile } = await requireRole(["veli"]);
  const { id } = await params;

  const survey = await getSurveyById(id);
  if (!survey || survey.status !== "active") notFound();

  const studentIds = await getParentStudentIds(profile.id);
  if (studentIds.length === 0) {
    return <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Bu ankete katılmak için bağlı bir talebeniz bulunmamaktadır.</div>;
  }

  const supabase = await createSupabaseServerClient();
  const { data: students } = await supabase.from("students").select("id, full_name").in("id", studentIds);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Veli Paneli" title={survey.title} description={survey.description ?? "Anket sorularını cevaplayın."} />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Anket Soruları</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={submitSurveyResponseAsParentAction.bind(null, id) as unknown as (formData: FormData) => void} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Talebe Seçin</label>
              <select name="student_id" required className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20">
                <option value="">Talebe seçin</option>
                {(students ?? []).map((s) => (
                  <option key={s.id} value={s.id}>{s.full_name}</option>
                ))}
              </select>
            </div>

            {survey.questions.map((q, i) => (
              <div key={q.id} className="rounded-lg border border-border p-3">
                <p className="text-sm font-medium">{i + 1}. {q.question_text}{q.is_required ? <span className="text-red-500">*</span> : ""}</p>
                <p className="text-xs text-muted-foreground mt-1">{typeLabels[q.question_type]}</p>

                {q.question_type === "scale" && (
                  <div className="mt-2 flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <label key={n} className="flex cursor-pointer flex-col items-center gap-1">
                        <input type="radio" name={`q_${q.id}`} value={String(n)} className="size-4" required={q.is_required} />
                        <span className="text-xs text-muted-foreground">{n}</span>
                      </label>
                    ))}
                  </div>
                )}

                {q.question_type === "yes_no" && (
                  <div className="mt-2 flex items-center gap-4">
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input type="radio" name={`q_${q.id}`} value="Evet" required={q.is_required} /> Evet
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input type="radio" name={`q_${q.id}`} value="Hayır" required={q.is_required} /> Hayır
                    </label>
                  </div>
                )}

                {q.question_type === "choice" && q.options && (
                  <div className="mt-2 space-y-1">
                    {(JSON.parse(typeof q.options === "string" ? q.options : JSON.stringify(q.options)) as string[]).map((opt) => (
                      <label key={opt} className="flex cursor-pointer items-center gap-2 text-sm">
                        <input type="radio" name={`q_${q.id}`} value={opt} required={q.is_required} /> {opt}
                      </label>
                    ))}
                  </div>
                )}

                {q.question_type === "text" && (
                  <div className="mt-2">
                    <textarea name={`q_${q.id}`} rows={3} className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20" required={q.is_required} />
                  </div>
                )}
              </div>
            ))}

            <div className="flex items-center gap-2">
              <button type="submit" className={cn(buttonVariants(), "cursor-pointer")}>Anketi Gönder</button>
              <Link href="/veli" className={cn(buttonVariants({ variant: "outline" }))}>İptal</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
