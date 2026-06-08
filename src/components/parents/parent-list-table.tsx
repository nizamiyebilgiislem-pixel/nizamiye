import Link from "next/link";
import { Eye, Pencil, Users } from "lucide-react";

import { ProfileAvatar } from "@/components/profiles/profile-avatar";
import { ActiveBadge, AuthBadge } from "@/components/profiles/profile-status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { canCreateParentProfile, canEditParentProfile } from "@/lib/parents/permissions";
import type { ParentProfileListItem } from "@/lib/parents/queries";
import { cn } from "@/lib/utils";
import type { ProfileRow } from "@/types/database";

type ParentListTableProps = {
  parents: ParentProfileListItem[];
  currentProfile: ProfileRow;
};

export function ParentListTable({ parents, currentProfile }: ParentListTableProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ad Soyad</TableHead>
                <TableHead>E-posta</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead>Auth</TableHead>
                <TableHead>Bağlı Talebe</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parents.map((parent) => (
                <TableRow key={parent.id}>
                  <TableCell className="min-w-64">
                    <div className="flex items-center gap-3">
                      <ProfileAvatar name={parent.full_name} photoUrl={parent.photo_url} />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{parent.full_name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {parent.linked_students.slice(0, 2).map((student) => student.full_name).join(", ") || "Bağlı talebe yok"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{parent.email ?? "-"}</TableCell>
                  <TableCell>{parent.phone ?? "-"}</TableCell>
                  <TableCell>
                    <AuthBadge authUserId={parent.auth_user_id} />
                  </TableCell>
                  <TableCell>{parent.linked_student_count}</TableCell>
                  <TableCell>
                    <ActiveBadge isActive={parent.is_active} />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Link href={`/veliler/${parent.id}`} className={cn(buttonVariants({ variant: "ghost", size: "icon" }))} aria-label="Veli detayını aç">
                        <Eye className="size-4" aria-hidden="true" />
                      </Link>
                      {canEditParentProfile(currentProfile, parent.linked_students.length) ? (
                        <Link
                          href={`/veliler/${parent.id}/duzenle`}
                          className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
                          aria-label="Veli profilini düzenle"
                        >
                          <Pencil className="size-4" aria-hidden="true" />
                        </Link>
                      ) : null}
                      {canCreateParentProfile(currentProfile) ? (
                        <Link
                          href={`/veliler/${parent.id}/talebeler`}
                          className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
                          aria-label="Talebe bağlantılarını yönet"
                        >
                          <Users className="size-4" aria-hidden="true" />
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
