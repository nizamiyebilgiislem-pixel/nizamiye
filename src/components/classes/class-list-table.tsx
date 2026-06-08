import Link from "next/link";
import { Eye, Pencil } from "lucide-react";

import { RichProfileCard } from "@/components/profiles/rich-profile-card";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { canEditClass } from "@/lib/classes/permissions";
import type { ClassWithRelations } from "@/lib/classes/queries";
import { cn } from "@/lib/utils";
import type { ProfileRow } from "@/types/database";

type ClassListTableProps = {
  classes: ClassWithRelations[];
  profile: ProfileRow;
};

export function ClassListTable({ classes, profile }: ClassListTableProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sınıf adı</TableHead>
                <TableHead>Bölüm</TableHead>
                <TableHead>Sınıf hocası</TableHead>
                <TableHead>Aktif öğrenci</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.map((classRow) => (
                <TableRow key={classRow.id}>
                  <TableCell className="min-w-44 font-medium">{classRow.name}</TableCell>
                  <TableCell>{classRow.department?.name ?? "-"}</TableCell>
                  <TableCell className="min-w-52">
                    {classRow.class_teacher ? (
                      <RichProfileCard
                        profile={classRow.class_teacher}
                        href={`/hocalar/${classRow.class_teacher.id}`}
                        compact
                        className="border-0 bg-transparent p-0 shadow-none hover:bg-transparent"
                      />
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>{classRow.active_student_count}</TableCell>
                  <TableCell>{classRow.is_active ? "Aktif" : "Pasif"}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/siniflar/${classRow.id}`}
                        className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
                        aria-label="Sınıf detayını aç"
                      >
                        <Eye className="size-4" aria-hidden="true" />
                      </Link>
                      {canEditClass(profile, classRow) ? (
                        <Link
                          href={`/siniflar/${classRow.id}/duzenle`}
                          className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
                          aria-label="Sınıfı düzenle"
                        >
                          <Pencil className="size-4" aria-hidden="true" />
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
  );
}
