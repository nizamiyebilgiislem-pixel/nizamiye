import Link from "next/link";
import { Eye, Pencil } from "lucide-react";

import { ProfileAvatar } from "@/components/profiles/profile-avatar";
import { StudentAvatar } from "@/components/students/student-avatar";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { canEditInfirmaryRecord } from "@/lib/infirmary/permissions";
import type { InfirmaryRecordWithRelations } from "@/lib/infirmary/queries";
import { cn } from "@/lib/utils";
import type { ProfileRow } from "@/types/database";

export function InfirmaryList({ records, profile }: { records: InfirmaryRecordWithRelations[]; profile: ProfileRow }) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>Tarih</TableHead><TableHead>Talebe</TableHead><TableHead>Bölüm</TableHead><TableHead>Sınıf</TableHead><TableHead>Şikayet</TableHead><TableHead>Sevk</TableHead><TableHead>Veli</TableHead><TableHead>Giren</TableHead><TableHead className="text-right">İşlemler</TableHead></TableRow></TableHeader>
            <TableBody>
              {records.map((record) => {
                const editable = record.student ? canEditInfirmaryRecord(profile, record.student, record.course_class) : false;
                return (
                  <TableRow key={record.id}>
                    <TableCell>{record.record_date}</TableCell>
                    <TableCell className="min-w-56">
                      {record.student ? (
                        <div className="flex items-center gap-3">
                          <StudentAvatar name={record.student.full_name} photoUrl={record.student.photo_url} previewable />
                          <div className="min-w-0">
                            <p className="truncate font-medium">{record.student.full_name}</p>
                            <p className="truncate text-xs text-muted-foreground">{record.course_class?.name ?? "Sınıf yok"}</p>
                          </div>
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>{record.department?.name ?? "-"}</TableCell>
                    <TableCell>{record.course_class?.name ?? "-"}</TableCell>
                    <TableCell className="max-w-64 truncate">{record.complaint ?? "-"}</TableCell>
                    <TableCell>{record.sent_to_hospital ? "Evet" : "Hayır"}</TableCell>
                    <TableCell>{record.parent_informed ? "Evet" : "Hayır"}</TableCell>
                    <TableCell>
                      {record.created_by_profile ? (
                        <div className="flex items-center gap-2">
                          <ProfileAvatar name={record.created_by_profile.full_name} photoUrl={record.created_by_profile.photo_url} size="sm" />
                          <span className="max-w-36 truncate">{record.created_by_profile.full_name}</span>
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell><div className="flex justify-end gap-2">
                      <Link href={`/revir/${record.id}`} className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}><Eye className="size-4" aria-hidden="true" /></Link>
                      {editable ? <Link href={`/revir/${record.id}/duzenle`} className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}><Pencil className="size-4" aria-hidden="true" /></Link> : null}
                    </div></TableCell>
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
