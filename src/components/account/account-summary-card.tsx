import Link from "next/link";

import { ProfileAvatar } from "@/components/profiles/profile-avatar";
import { ActiveBadge, AuthBadge, ProfileRoleBadge } from "@/components/profiles/profile-status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AccountProfile } from "@/lib/account/queries";
import { getProfileAge } from "@/lib/account/utils";
import { cn } from "@/lib/utils";

type AccountSummaryCardProps = {
  profile: AccountProfile;
};

export function AccountSummaryCard({ profile }: AccountSummaryCardProps) {
  const age = getProfileAge(profile.birth_date);
  const isStaffLike = profile.role !== "veli";

  return (
    <Card>
      <CardHeader className="border-b border-border">
        <CardTitle>Profil Özeti</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <ProfileAvatar name={profile.full_name} photoUrl={profile.photo_url} size="lg" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-muted-foreground">{profile.department?.name ?? "Bölüm yok"}</p>
              <h2 className="truncate text-2xl font-semibold text-[#093657]">{profile.full_name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{profile.email ?? "E-posta yok"}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <ProfileRoleBadge role={profile.role} />
                <AuthBadge authUserId={profile.auth_user_id} />
                <ActiveBadge isActive={profile.is_active} />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/hesabim/profil" className={cn(buttonVariants())}>
              Profilimi Düzenle
            </Link>
            <Link href="/hesabim/guvenlik" className={cn(buttonVariants({ variant: "secondary" }))}>
              Güvenlik Ayarları
            </Link>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Info label="Telefon" value={profile.phone} />
          <Info label="Memleket" value={profile.hometown} />
          <Info label="Yaş" value={age !== null ? String(age) : null} />
          <Info label="Adres" value={profile.address} />
          {isStaffLike ? <Info label="Mezun Olduğu Okul" value={profile.school_name} /> : null}
          {isStaffLike ? <Info label="Uzmanlık Dalı" value={profile.expertise_area} /> : null}
          <Info label="Rol" value={profile.role} />
          <Info label="Bölüm" value={profile.department?.name} />
        </div>

        <div className="rounded-md border border-border bg-background p-4">
          <p className="text-xs text-muted-foreground">Kısa Açıklama</p>
          <p className="mt-2 text-sm leading-6 text-foreground">{profile.biography ?? "Kısa açıklama eklenmedi."}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value || "-"}</p>
    </div>
  );
}
