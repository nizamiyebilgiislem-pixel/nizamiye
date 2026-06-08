import { notFound } from "next/navigation";

import { AccountFeedback } from "@/components/account/account-feedback";
import { AccountSecurityForm } from "@/components/account/account-security-form";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateOwnPasswordAction } from "@/lib/account/actions";
import { getAccountProfile } from "@/lib/account/queries";
import { requireAuth } from "@/lib/auth";

type MySecurityPageProps = {
  searchParams: Promise<{ error?: string; success?: string }>;
};

export default async function MySecurityPage({ searchParams }: MySecurityPageProps) {
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
        title="Güvenlik Ayarları"
        description="Kendi şifrenizi güncelleyin. E-posta değişikliği bu fazda yönetici kontrollüdür."
      />
      <AccountFeedback error={query.error} success={query.success} />
      <Card>
        <CardHeader>
          <CardTitle>Şifre Değiştir</CardTitle>
        </CardHeader>
        <CardContent>
          <AccountSecurityForm profile={accountProfile} action={updateOwnPasswordAction} />
        </CardContent>
      </Card>
    </div>
  );
}
