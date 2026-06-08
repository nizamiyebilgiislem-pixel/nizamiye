import Link from "next/link";
import { Eye, Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { canManageDepartments } from "@/lib/departments/permissions";
import type { DepartmentSummary } from "@/lib/departments/queries";
import { cn } from "@/lib/utils";
import type { ProfileRow } from "@/types/database";

type DepartmentListTableProps = {
  departments: DepartmentSummary[];
  profile: ProfileRow;
};

export function DepartmentListTable({ departments, profile }: DepartmentListTableProps) {
  const canEdit = canManageDepartments(profile);

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bölüm Adı</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Açıklama</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Sınıf Sayısı</TableHead>
                <TableHead>Talebe Sayısı</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((department) => (
                <TableRow key={department.id}>
                  <TableCell className="min-w-48 font-medium">{department.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{department.slug}</TableCell>
                  <TableCell className="min-w-64">{department.description ?? "-"}</TableCell>
                  <TableCell>
                    <Badge variant={department.is_active ? "default" : "secondary"}>{department.is_active ? "Aktif" : "Pasif"}</Badge>
                  </TableCell>
                  <TableCell>{department.active_class_count}</TableCell>
                  <TableCell>{department.active_student_count}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/bolumler/${department.id}`}
                        className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
                        aria-label="Bölüm detayını aç"
                      >
                        <Eye className="size-4" aria-hidden="true" />
                      </Link>
                      {canEdit ? (
                        <Link
                          href={`/bolumler/${department.id}/duzenle`}
                          className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
                          aria-label="Bölümü düzenle"
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
