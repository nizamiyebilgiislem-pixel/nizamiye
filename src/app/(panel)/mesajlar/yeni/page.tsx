import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireAuth } from "@/lib/auth";
import { getRecipientsForSender } from "@/lib/messages/actions";
import { YeniMesajClient } from "./yeni-mesaj-client";

export default async function YeniMesajPage() {
  const { profile } = await requireAuth();

  const recipients = await getRecipientsForSender(profile);

  if (recipients.length === 0) {
    return (
      <div className="space-y-4">
        <PageHeader
          eyebrow="Mesajlaşma"
          title="Yeni Mesaj"
        />
        <EmptyState
          title="Şu an mesaj gönderebileceğiniz bir kullanıcı bulunamadı."
          description="Veliler sadece öğretmenlere mesaj gönderebilir."
          action={<Link href="/mesajlar" className="text-sm text-[#093657] hover:underline">← Geri dön</Link>}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Link
          href="/mesajlar"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Geri
        </Link>
      </div>

      <PageHeader
        eyebrow="Mesajlaşma"
        title="Yeni Mesaj"
        description="Yeni bir mesaj başlatın"
      />

      <Card>
        <CardContent className="p-6">
          <YeniMesajClient recipients={recipients} currentProfileRole={profile.role} />
        </CardContent>
      </Card>
    </div>
  );
}