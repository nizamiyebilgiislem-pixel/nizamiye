import { EvaluationEntryList } from "@/components/evaluations/evaluation-entry-list";
import { EvaluationErrorMessage } from "@/components/evaluations/evaluation-error-message";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { NativeSelect } from "@/components/ui/native-select";
import { requireAuth } from "@/lib/auth";
import { getEvaluationEntryList } from "@/lib/evaluations/queries";

type EvaluationEntryPageProps = { searchParams: Promise<{ department?: string; class?: string; error?: string }> };

export default async function EvaluationEntryPage({ searchParams }: EvaluationEntryPageProps) {
  const params = await searchParams;
  const { profile } = await requireAuth();
  const { departments, classes, selectedClass, students } = await getEvaluationEntryList(profile, {
    departmentId: params.department,
    classId: params.class,
  });

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Kanaat Sistemi" title="Kanaat GiriÅŸi" description="BÃ¶lÃ¼m ve sÄ±nÄ±f seÃ§erek aktif talebelerin kanaatlerini yÃ¶netin." />
      <EvaluationErrorMessage error={params.error} />
      <Card>
        <CardContent className="p-4">
          <form action="/kanaat-sistemi/kanaat-girisi" className="grid gap-3 md:grid-cols-[220px_220px_auto]">
            <NativeSelect name="department" defaultValue={params.department ?? selectedClass?.department_id ?? ""} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
            </NativeSelect>
            <NativeSelect name="class" defaultValue={selectedClass?.id ?? ""} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              {classes.map((classRow) => <option key={classRow.id} value={classRow.id}>{classRow.name}</option>)}
            </NativeSelect>
            <Button type="submit">GÃ¶ster</Button>
          </form>
        </CardContent>
      </Card>
      {students.length > 0 ? (
        <EvaluationEntryList students={students} profile={profile} selectedClass={selectedClass} />
      ) : (
        <EmptyState title="SeÃ§ili sÄ±nÄ±fta aktif talebe bulunamadÄ±." />
      )}
    </div>
  );
}
