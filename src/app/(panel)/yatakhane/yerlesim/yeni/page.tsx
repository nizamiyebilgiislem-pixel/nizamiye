import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { buttonVariants } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth";
import { createDormitoryAssignmentAction } from "@/lib/dormitory/actions";
import { canManageDormitoryAssignments } from "@/lib/dormitory/permissions";
import { getDormitoryAssignments, getDormitorySelectionOptions } from "@/lib/dormitory/queries";
import { cn } from "@/lib/utils";

type DormitoryAssignmentCreatePageProps = {
  searchParams: Promise<{ studentId?: string; bedId?: string }>;
};

export default async function DormitoryAssignmentCreatePage({ searchParams }: DormitoryAssignmentCreatePageProps) {
  const { profile } = await requireAuth();
  if (!canManageDormitoryAssignments(profile)) {
    redirect("/yatakhane/yerlesim");
  }

  const query = await searchParams;
  const [options, activeAssignments] = await Promise.all([getDormitorySelectionOptions(profile), getDormitoryAssignments(profile, { status: "active" })]);
  const activeAssignmentByStudentId = new Map(activeAssignments.map((assignment) => [assignment.student_id, assignment]));
  const defaultStudentId = query.studentId ?? options.students.find((student) => !activeAssignmentByStudentId.has(student.id))?.id ?? options.students[0]?.id ?? "";
  const defaultBedId = query.bedId ?? options.beds.find((bed) => !bed.assignment)?.id ?? options.beds[0]?.id ?? "";
  const currentAssignment = defaultStudentId ? activeAssignmentByStudentId.get(defaultStudentId) ?? null : null;

  async function submitAction(formData: FormData) {
    "use server";
    await createDormitoryAssignmentAction(formData);
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Yatakhane" title="Yeni Yerleşim" description="Talebeyi boş yatağa yerleştirin." />

      {currentAssignment ? (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-4 text-sm text-amber-900">
            Bu talebenin aktif yerleşimi var. Önce yerleşimi sonlandırmanız gerekir.
            <div className="mt-2">
              <Link href={`/yatakhane/yerlesim/${currentAssignment.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                Mevcut Yerleşim
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="p-4">
          <form action={submitAction} className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <select name="student_id" required defaultValue={defaultStudentId} className="h-10 rounded-md border border-border bg-background px-3 text-sm">
                <option value="">Talebe seçin</option>
                {options.students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.full_name} {activeAssignmentByStudentId.has(student.id) ? "(aktif yerleşim var)" : ""}
                  </option>
                ))}
              </select>
              <select name="bed_id" required defaultValue={defaultBedId} className="h-10 rounded-md border border-border bg-background px-3 text-sm">
                <option value="">Boş yatak seçin</option>
                {options.beds
                  .filter((bed) => !bed.assignment)
                  .map((bed) => (
                    <option key={bed.id} value={bed.id}>
                      {bed.dormitory?.name ?? "-"} / {bed.floor?.name ?? "-"} / {bed.room?.name ?? "-"} / {bed.bed_no}
                    </option>
                  ))}
              </select>
              <Input name="start_date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
            </div>
            <Textarea name="note" placeholder="Not" />
            <div className="flex justify-end">
              <button type="submit" className={cn(buttonVariants())}>
                Kaydet
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
