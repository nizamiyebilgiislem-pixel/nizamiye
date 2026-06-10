import Link from "next/link";
import { HeartHandshake, MessageSquare, ListChecks, Eye } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getTaskCounts } from "@/lib/tasks/queries";
import { getTalepCounts } from "@/lib/talepler/queries";
import type { ProfileRow } from "@/types/database";

export async function SupportDashboard({ profile }: { profile: ProfileRow }) {
  const [taskCounts, talepCounts] = await Promise.all([
    getTaskCounts(profile),
    getTalepCounts(profile).catch(() => ({ total: 0, bekliyor: 0, incelemede: 0, isleme_alindi: 0, onaylandi: 0, reddedildi: 0, tamamlandi: 0, iptal_edildi: 0, acil: 0, gelen: 0, giden: 0 })),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Destek Birimi"
        title="Dashboard"
        description="Talepleri, görevleri ve sistem kayıtlarını salt okunur izleyin."
      />

      <Card className="border-[#093657]/10 bg-white">
        <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#eaf1f6]">
              <Eye className="size-5 text-[#093657]" aria-hidden />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Salt Okunur Erişim</p>
              <p className="mt-0.5 text-sm font-semibold text-[#093657]">{profile.full_name}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Destek birimi olarak tüm modülleri görüntüleyebilir, düzenleme yapamazsınız.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-[#093657]/10 bg-white">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#eaf1f6]">
              <MessageSquare className="size-5 text-[#093657]" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-muted-foreground">Açık Talepler</p>
              <p className="text-lg font-semibold text-[#093657]">{talepCounts.bekliyor + talepCounts.incelemede}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[#093657]/10 bg-white">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#eaf1f6]">
              <ListChecks className="size-5 text-[#093657]" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-muted-foreground">Açık Görevler</p>
              <p className="text-lg font-semibold text-[#093657]">{taskCounts.pending + taskCounts.in_progress}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[#093657]/10 bg-white">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#eaf1f6]">
              <HeartHandshake className="size-5 text-[#093657]" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-muted-foreground">Geciken Görev</p>
              <p className="text-lg font-semibold text-[#093657]">{taskCounts.overdue}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="bg-white">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-base">Hızlı Erişim</CardTitle>
            <CardDescription>Sık kullanılan salt okunur sayfalar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 p-4">
            <Link href="/talebeler" className="flex items-center gap-2 rounded-lg border border-[#e5e7eb] bg-[#f8fafc] p-3 text-sm font-medium text-[#093657] hover:bg-[#eaf1f6]">
              Talebeler
            </Link>
            <Link href="/talepler" className="flex items-center gap-2 rounded-lg border border-[#e5e7eb] bg-[#f8fafc] p-3 text-sm font-medium text-[#093657] hover:bg-[#eaf1f6]">
              Talep Yönetimi
            </Link>
            <Link href="/siniflar" className="flex items-center gap-2 rounded-lg border border-[#e5e7eb] bg-[#f8fafc] p-3 text-sm font-medium text-[#093657] hover:bg-[#eaf1f6]">
              Sınıflar
            </Link>
            <Link href="/raporlar" className="flex items-center gap-2 rounded-lg border border-[#e5e7eb] bg-[#f8fafc] p-3 text-sm font-medium text-[#093657] hover:bg-[#eaf1f6]">
              Raporlar
            </Link>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-base">Bilgi</CardTitle>
            <CardDescription>Yetki ve erişim bilgileri.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 p-4 text-sm text-muted-foreground">
            <p>Destek Birim Müdürü olarak tüm sistemi salt okunur görüntüleyebilirsiniz.</p>
            <p>Hiçbir modülde oluşturma, düzenleme veya silme işlemi yapamazsınız.</p>
            <p>Rehberlik modülüne varsayılan olarak erişiminiz bulunmamaktadır.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
