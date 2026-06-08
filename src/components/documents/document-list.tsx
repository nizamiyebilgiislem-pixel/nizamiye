import Link from "next/link";
import { ExternalLink, Eye, Pencil } from "lucide-react";

import { ProfileAvatar } from "@/components/profiles/profile-avatar";
import { StudentAvatar } from "@/components/students/student-avatar";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { canEditStudentDocuments } from "@/lib/documents/permissions";
import type { StudentDocumentWithRelations } from "@/lib/documents/queries";
import { cn } from "@/lib/utils";
import type { ProfileRow } from "@/types/database";

export function DocumentList({ documents, profile }: { documents: StudentDocumentWithRelations[]; profile: ProfileRow }) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>Evrak Türü</TableHead><TableHead>Talebe</TableHead><TableHead>Bölüm</TableHead><TableHead>Sınıf</TableHead><TableHead>Dosya URL</TableHead><TableHead>Yükleyen</TableHead><TableHead>Tarih</TableHead><TableHead className="text-right">İşlemler</TableHead></TableRow></TableHeader>
            <TableBody>
              {documents.map((document) => {
                const editable = document.student ? canEditStudentDocuments(profile, document.student, document.course_class) : false;
                return (
                  <TableRow key={document.id}>
                    <TableCell className="font-medium">{document.document_type}</TableCell>
                    <TableCell className="min-w-56">
                      {document.student ? (
                        <div className="flex items-center gap-3">
                          <StudentAvatar name={document.student.full_name} photoUrl={document.student.photo_url} previewable />
                          <div className="min-w-0">
                            <p className="truncate font-medium">{document.student.full_name}</p>
                            <p className="truncate text-xs text-muted-foreground">{document.course_class?.name ?? "Sınıf yok"}</p>
                          </div>
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>{document.department?.name ?? "-"}</TableCell>
                    <TableCell>{document.course_class?.name ?? "-"}</TableCell>
                    <TableCell className="max-w-64 truncate">{document.file_url}</TableCell>
                    <TableCell>
                      {document.uploaded_by_profile ? (
                        <div className="flex items-center gap-2">
                          <ProfileAvatar name={document.uploaded_by_profile.full_name} photoUrl={document.uploaded_by_profile.photo_url} size="sm" />
                          <span className="max-w-36 truncate">{document.uploaded_by_profile.full_name}</span>
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>{formatDate(document.created_at)}</TableCell>
                    <TableCell><div className="flex justify-end gap-2">
                      <a href={document.file_url} target="_blank" rel="noreferrer" className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}><ExternalLink className="size-4" aria-hidden="true" /></a>
                      <Link href={`/evraklar/${document.id}`} className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}><Eye className="size-4" aria-hidden="true" /></Link>
                      {editable ? <Link href={`/evraklar/${document.id}/duzenle`} className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}><Pencil className="size-4" aria-hidden="true" /></Link> : null}
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(new Date(value));
}
