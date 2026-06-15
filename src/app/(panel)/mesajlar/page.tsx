import Link from "next/link";
import { Plus } from "lucide-react";

import { requireAuth } from "@/lib/auth";
import { getConversationList } from "@/lib/messages/actions";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ConversationList } from "@/components/messages";

export default async function MesajlarPage() {
  const { profile } = await requireAuth();
  const conversations = await getConversationList(profile);

  const unreadCount = conversations.reduce((acc, c) => acc + c.unread, 0);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Mesajlaşma"
        title="Mesajlar"
        description={unreadCount > 0 ? `${unreadCount} okunmamış mesaj` : "WhatsApp tarzı mesajlaşma sistemi"}
        actions={
          <Link href="/mesajlar/yeni" className={cn(buttonVariants({ size: "sm" }))}>
            <Plus className="mr-1.5 size-4" />
            Yeni Mesaj
          </Link>
        }
      />

      <Card>
        <CardContent className="p-0">
          <ConversationList conversations={conversations} currentProfileId={profile.id} />
        </CardContent>
      </Card>
    </div>
  );
}