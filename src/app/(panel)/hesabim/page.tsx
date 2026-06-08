import { PageHeader } from "@/components/layout/page-header";
import { AccountFeedback } from "@/components/account/account-feedback";
import { AccountSummaryCard } from "@/components/account/account-summary-card";
import { requireAuth } from "@/lib/auth";
import { getAccountProfile } from "@/lib/account/queries";
import { notFound } from "next/navigation";

type MyAccountPageProps = {
  searchParams: Promise<{ error?: string; success?: string }>;
};

export default async function MyAccountPage({ searchParams }: MyAccountPageProps) {
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
        title="Hesap Ayarları"
        description="Kendi profil özetinizi görüntüleyin, profil bilgilerinizi güncelleyin ve güvenlik ayarlarını yönetin."
      />
      <AccountFeedback error={query.error} success={query.success} />
      <AccountSummaryCard profile={accountProfile} />
    </div>
  );
}
