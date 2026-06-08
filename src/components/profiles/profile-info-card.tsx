import { RichProfileCard } from "@/components/profiles/rich-profile-card";
import { ActiveBadge, AuthBadge, ProfileRoleBadge } from "@/components/profiles/profile-status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProfileAge } from "@/lib/account/utils";
import { roleLabels } from "@/lib/route-permissions";
import type { ProfileDetail, ProfileWithDepartment } from "@/lib/profiles/queries";

type ProfileInfoCardProps = {
  profile: ProfileWithDepartment | ProfileDetail;
};

export function ProfileInfoCard({ profile }: ProfileInfoCardProps) {
  const age = getProfileAge(profile.birth_date);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profil Bilgileri</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="md:col-span-2 xl:col-span-4">
          <RichProfileCard profile={profile} showStatus showAuth />
        </div>
        <Info label="Ad Soyad" value={profile.full_name} />
        <Info label="E-posta" value={profile.email} />
        <Info label="Telefon" value={profile.phone} />
        <div className="rounded-md border border-border bg-background p-3">
          <p className="text-xs text-muted-foreground">Rol</p>
          <div className="mt-2">
            <ProfileRoleBadge role={profile.role} />
          </div>
          <p className="sr-only">{roleLabels[profile.role]}</p>
        </div>
        <Info label="Bölüm" value={profile.department?.name} />
        <Info label="Memleket" value={profile.hometown} />
        <Info label="Yaş" value={age ? `${age}` : null} />
        <Info label="Mezun olduğu okul" value={profile.school_name} />
        <Info label="Uzmanlık alanı" value={profile.expertise_area} />
        <div className="rounded-md border border-border bg-background p-3">
          <p className="text-xs text-muted-foreground">Durum</p>
          <div className="mt-2">
            <ActiveBadge isActive={profile.is_active} />
          </div>
        </div>
        <div className="rounded-md border border-border bg-background p-3">
          <p className="text-xs text-muted-foreground">Auth bağlantısı</p>
          <div className="mt-2">
            <AuthBadge authUserId={profile.auth_user_id} />
          </div>
        </div>
        {profile.biography ? (
          <div className="rounded-md border border-border bg-background p-3 md:col-span-2 xl:col-span-4">
            <p className="text-xs text-muted-foreground">Kısa biyografi</p>
            <p className="mt-1 text-sm leading-6">{profile.biography}</p>
          </div>
        ) : null}
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
