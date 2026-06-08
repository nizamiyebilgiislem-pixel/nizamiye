import Link from "next/link";
import { Eye, Pencil } from "lucide-react";

import { StudentAvatar } from "@/components/students/student-avatar";
import { StatusBadge } from "@/components/students/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
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
                <TableHead>Fotoğraf</TableHead>
                <TableHead>Ad Soyad</TableHead>
                <TableHead>Bölüm</TableHead>
                <TableHead>Kurs Sınıfı</TableHead>
                <TableHead>Okul Sınıfı</TableHead>
                <TableHead>Veli Telefonu</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => {
                const editable = canEditStudent(profile, student, student.course_class);

                return (
                  <TableRow key={student.id}>
                    <TableCell>
                      <StudentAvatar name={student.full_name} photoUrl={student.photo_url} previewable />
                    </TableCell>
                    <TableCell className="min-w-48 font-medium">{student.full_name}</TableCell>
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
                          href={`/talebeler/${student.id}`}
                          className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
                          aria-label="Talebe detayını aç"
                        >
                          <Eye className="size-4" aria-hidden="true" />
                        </Link>
                        {editable ? (
                          <Link
                            href={`/talebeler/${student.id}/duzenle`}
                            className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
                            aria-label="Talebeyi düzenle"
                          >
                            <Pencil className="size-4" aria-hidden="true" />
                          </Link>
                        ) : null}
                        {showReactivate && reactivateAction ? (
                          <form action={reactivateAction}>
                            <input type="hidden" name="id" value={student.id} />
                            <Button type="submit" variant="secondary" size="sm">
                              Aktif yap
                            </Button>
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
