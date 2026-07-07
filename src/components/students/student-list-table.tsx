import Link from "next/link";
import { Eye, Pencil } from "lucide-react";

import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { StudentCompactCard } from "@/components/students/student-compact-card";
import { StatusBadge } from "@/components/students/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { canEditStudent } from "@/lib/students/permissions";
import type { StudentWithRelations } from "@/lib/students/queries";
import { cn } from "@/lib/utils";
import type { ProfileRow } from "@/types/database";

type StudentListTableProps = {
  students: StudentWithRelations[];
  profile: ProfileRow;
  showReactivate?: boolean;
  reactivateAction?: (formData: FormData) => void | Promise<void>;
};

export function StudentListTable({ students, profile, showReactivate, reactivateAction }: StudentListTableProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Talebe</TableHead>
                <TableHead>Bolum</TableHead>
                <TableHead>Kurs Sinifi</TableHead>
                <TableHead>Okul Sinifi</TableHead>
                <TableHead>Veli Telefonu</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">Islemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => {
                const editable = canEditStudent(profile, student, student.course_class);
                const detailHref = `/talebeler/${student.id}`;

                return (
                  <TableRow key={student.id}>
                    <TableCell className="min-w-72">
                      <StudentCompactCard
                        student={student}
                        href={detailHref}
                        className="border-0 bg-transparent p-0 shadow-none hover:bg-transparent"
                      />
                    </TableCell>
                    <TableCell>{student.department?.name ?? "-"}</TableCell>
                    <TableCell>{student.course_class?.name ?? "-"}</TableCell>
                    <TableCell>{student.school_class ?? "-"}</TableCell>
                    <TableCell>{student.guardian_phone ?? "-"}</TableCell>
                    <TableCell>
                      <StatusBadge status={student.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Link
                          href={detailHref}
                          className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
                          aria-label="Talebe detayini ac"
                        >
                          <Eye className="size-4" aria-hidden="true" />
                        </Link>
                        {editable ? (
                          <Link
                            href={`/talebeler/${student.id}/duzenle`}
                            className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
                            aria-label="Talebeyi duzenle"
                          >
                            <Pencil className="size-4" aria-hidden="true" />
                          </Link>
                        ) : null}
                        {showReactivate && reactivateAction ? (
                          <form action={reactivateAction}>
                            <input type="hidden" name="id" value={student.id} />
                            <FormSubmitButton pendingLabel="Aktiflestiriliyor..." variant="secondary" size="sm">
                              Aktif yap
                            </FormSubmitButton>
                          </form>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
