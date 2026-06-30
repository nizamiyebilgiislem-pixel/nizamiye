import Link from "next/link";

import { EducationErrorMessage } from "@/components/education/education-error-message";
import { PageHeader } from "@/components/layout/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { NativeSelect } from "@/components/ui/native-select";
import { requireAuth } from "@/lib/auth";
import { getEducationSelectionData } from "@/lib/education/queries";
import { cn } from "@/lib/utils";

type Props = {
  searchParams: Promise<{ department?: string; class?: string; error?: string; saved?: string }>;
};

export default async function EducationScheduleLandingPage({ searchParams }: Props) {
  const query = await searchParams;
  const { profile } = await requireAuth();
  const selection = await getEducationSelectionData(profile, { departmentId: query.department, classId: query.class });

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Akademik" title="Ders ProgramÄ±" description="BÃ¶lÃ¼m ve sÄ±nÄ±f seÃ§erek haftalÄ±k ders programÄ±na geÃ§in." />
      <EducationErrorMessage error={query.error} saved={query.saved} />

      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle>SÄ±nÄ±f SeÃ§imi</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <form action="/egitim-planlama/ders-programi" className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
            <NativeSelect name="department" defaultValue={query.department ?? selection.selectedDepartment?.id ?? ""} className="h-10 rounded-md border border-border bg-background px-3 text-sm shadow-sm">
              <option value="">BÃ¶lÃ¼m seÃ§in</option>
              {selection.departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </NativeSelect>
            <NativeSelect name="class" defaultValue={selection.selectedClass?.id ?? ""} className="h-10 rounded-md border border-border bg-background px-3 text-sm shadow-sm">
              <option value="">SÄ±nÄ±f seÃ§in</option>
              {selection.classes.map((classRow) => (
                <option key={classRow.id} value={classRow.id}>
                  {classRow.name}
                </option>
              ))}
            </NativeSelect>
            <Button type="submit">
              SÄ±nÄ±fa Git
            </Button>
          </form>
        </CardContent>
      </Card>

      {selection.classes.length > 0 ? (
        <Card>
          <CardHeader className="border-b border-border">
            <CardTitle>SÄ±nÄ±flar</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
            {selection.classes.map((classRow) => (
              <div key={classRow.id} className="rounded-md border border-border bg-white p-4 shadow-sm">
                <p className="text-sm text-muted-foreground">{classRow.department?.name ?? "-"}</p>
                <p className="mt-1 text-lg font-semibold text-[#093657]">{classRow.name}</p>
                <div className="mt-4 flex justify-end">
                  <Link href={`/egitim-planlama/ders-programi/${classRow.id}`} className={cn(buttonVariants({ size: "sm" }))}>
                    SÄ±nÄ±fa Git
                  </Link>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <EmptyState title="GÃ¶rÃ¼ntÃ¼lenecek sÄ±nÄ±f bulunamadÄ±." />
      )}
    </div>
  );
}
