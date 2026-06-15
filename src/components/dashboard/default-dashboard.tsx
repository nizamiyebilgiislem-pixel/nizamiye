import { LayoutDashboard } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import type { ProfileRow } from "@/types/database";

export function DefaultDashboard({ profile }: { profile: ProfileRow }) {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Yönetim Paneli"
        title="Hoş Geldiniz"
        description="Nizamiye Öğrenci Yönetim Sistemi."
      />
      <Card className="border-[#093657]/10 bg-white">
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <LayoutDashboard className="size-12 text-muted-foreground" aria-hidden />
          <div className="space-y-1 text-center">
            <p className="text-lg font-semibold text-[#093657]">
              {profile.full_name}
            </p>
            <p className="text-sm text-muted-foreground">
              Rolünüze ait dashboard henüz yapılandırılmadı. Sol menüden ilgili sayfalara erişebilirsiniz.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
