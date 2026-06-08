import { notFound } from "next/navigation";

import { AccountFeedback } from "@/components/account/account-feedback";
import { AccountProfileForm } from "@/components/account/account-profile-form";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateOwnProfileAction } from "@/lib/account/actions";
import { getAccountProfile } from "@/lib/account/queries";
import { requireAuth } from "@/lib/auth";

type MyProfilePageProps = {
  searchParams: Promise<{ error?: string; success?: string }>;
};

export default async function MyProfilePage({ searchParams }: MyProfilePageProps) {
  const query = await searchParams;
  const { profile } = await requireAuth();
  const accountProfile = await getAccountProfile(profile.id);

  if (!accountProfile) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Hesabım"
        title="Profil Bilgileri"
        description="Kendi temel profil bilgilerinizi güncelleyin. Rol, bölüm ve hesap bağlantısı burada değiştirilemez."
      />
      <AccountFeedback error={query.error} success={query.success} />
      <Card>
        <CardHeader>
          <CardTitle>Profilimi Düzenle</CardTitle>
        </CardHeader>
        <CardContent>
          <AccountProfileForm profile={accountProfile} action={updateOwnProfileAction} />
        </CardContent>
      </Card>
    </div>
  );
}
