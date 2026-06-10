import Link from "next/link";
import { Eye, Pencil } from "lucide-react";

import { RichProfileCard } from "@/components/profiles/rich-profile-card";
import { ActiveBadge, AuthBadge, ProfileRoleBadge } from "@/components/profiles/profile-status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { canEditStaffProfile } from "@/lib/profiles/permissions";
import type { ProfileWithDepartment } from "@/lib/profiles/queries";
import { cn } from "@/lib/utils";
import type { ProfileRow } from "@/types/database";

type ProfileListTableProps = {
  profiles: ProfileWithDepartment[];
  currentProfile: ProfileRow;
  detailBasePath: "/hocalar" | "/kullanicilar";
  showEdit?: boolean;
  showCreatedAt?: boolean;
};

export function ProfileListTable({ profiles, currentProfile, detailBasePath, showEdit, showCreatedAt }: ProfileListTableProps) {
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
                <TableHead>Rol</TableHead>
                <TableHead>Bölüm</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Auth</TableHead>
                {showCreatedAt ? <TableHead>Oluşturulma</TableHead> : null}
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell className="min-w-56">
                    <RichProfileCard
                      profile={profile}
                      href={`${detailBasePath}/${profile.id}`}
                      compact
                      className="border-0 bg-transparent p-0 shadow-none hover:bg-transparent"
                    />
                  </TableCell>
                  <TableCell>{profile.email ?? "-"}</TableCell>
                  <TableCell>{profile.phone ?? "-"}</TableCell>
                  <TableCell>
                    <ProfileRoleBadge role={profile.role} />
                  </TableCell>
                  <TableCell>{profile.department?.name ?? "-"}</TableCell>
                  <TableCell>
                    <ActiveBadge isActive={profile.is_active} />
                  </TableCell>
                  <TableCell>
                    <AuthBadge authUserId={profile.auth_user_id} />
                  </TableCell>
                  {showCreatedAt ? <TableCell>{formatDate(profile.created_at)}</TableCell> : null}
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`${detailBasePath}/${profile.id}`}
                        className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
                        aria-label="Profil detayını aç"
                      >
                        <Eye className="size-4" aria-hidden="true" />
                      </Link>
                      {showEdit && canEditStaffProfile(currentProfile, profile) ? (
                        <Link
                          href={`${detailBasePath}/${profile.id}/duzenle`}
                          className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
                          aria-label="Profili düzenle"
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(new Date(value));
}
