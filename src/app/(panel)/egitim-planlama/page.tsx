import Link from "next/link";

import { EducationErrorMessage } from "@/components/education/education-error-message";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireAuth } from "@/lib/auth";
import { getEducationDashboard, getEducationSelectionData } from "@/lib/education/queries";
import { cn } from "@/lib/utils";

type EducationPlanningPageProps = {
  searchParams: Promise<{ department?: string; class?: string; error?: string; saved?: string }>;
};

export default async function EducationPlanningPage({ searchParams }: EducationPlanningPageProps) {
  const query = await searchParams;
  const { profile } = await requireAuth();
  const [dashboard, selection] = await Promise.all([
    getEducationDashboard(profile),
    getEducationSelectionData(profile, { departmentId: query.department, classId: query.class }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Akademik"
        title="Eğitim Planlama"
        description="Sınıf ders atamaları ve haftalık program yönetimi."
      />

      <EducationErrorMessage error={query.error} saved={query.saved} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Aktif Sınıf" value={dashboard.summary.activeClassCount} />
        <SummaryCard label="Atamalı Sınıf" value={dashboard.summary.assignedClassCount} />
        <SummaryCard label="Programlı Sınıf" value={dashboard.summary.scheduledClassCount} />
        <SummaryCard label="Hocasız Ders" value={dashboard.summary.missingTeacherAssignmentCount} />
      </section>

      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle>Sınıf Seçimi</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <form action="/egitim-planlama" className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
            <select name="department" defaultValue={query.department ?? selection.selectedDepartment?.id ?? ""} className="h-10 rounded-md border border-border bg-background px-3 text-sm shadow-sm">
              <option value="">Bölüm seçin</option>
              {selection.departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
            <select name="class" defaultValue={selection.selectedClass?.id ?? ""} className="h-10 rounded-md border border-border bg-background px-3 text-sm shadow-sm">
              <option value="">Sınıf seçin</option>
              {selection.classes.map((classRow) => (
                <option key={classRow.id} value={classRow.id}>
                  {classRow.name}
                </option>
              ))}
            </select>
            <Button type="submit">
              Filtrele
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle>Sınıflar</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sınıf</TableHead>
                  <TableHead>Bölüm</TableHead>
                  <TableHead>Ders Sayısı</TableHead>
                  <TableHead>Program Slotu</TableHead>
                  <TableHead>Hocasız Ders</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboard.classes.map((classRow) => (
                  <TableRow key={classRow.id}>
                    <TableCell className="font-medium text-[#093657]">{classRow.name}</TableCell>
                    <TableCell>{classRow.department?.name ?? "-"}</TableCell>
                    <TableCell>{classRow.active_class_course_count}</TableCell>
                    <TableCell>{classRow.active_schedule_slot_count}</TableCell>
                    <TableCell>
                      {classRow.missing_teacher_count > 0 ? <Badge variant="outline">Var</Badge> : <Badge variant="default">Yok</Badge>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={classRow.is_active ? "default" : "outline"}>{classRow.is_active ? "Aktif" : "Pasif"}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        {["admin", "genel_mudur", "bolum_muduru"].includes(profile.role) ? (
                          <Link href={`/egitim-planlama/ders-atamalari/${classRow.id}`} className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}>
                            Ders Atamaları
                          </Link>
                        ) : null}
                        {profile.role !== "destek_birim_muduru" ? (
                          <Link href={`/egitim-planlama/ders-programi/${classRow.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                            Ders Programı
                          </Link>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight text-[#093657]">{value}</p>
      </CardContent>
    </Card>
  );
}
