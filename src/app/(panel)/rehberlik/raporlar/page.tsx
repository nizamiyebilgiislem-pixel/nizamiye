import Link from "next/link";
import { HeartHandshake, ClipboardList, FileText, CalendarDays } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth";
import { canViewGuidance } from "@/lib/guidance/permissions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const reports = [
  { href: "/rehberlik/gorusmeler", icon: HeartHandshake, label: "Görüşme Raporu", desc: "Tüm görüşmelerin listesi ve detayları" },
  { href: "/rehberlik/takipler", icon: ClipboardList, label: "Takip Raporu", desc: "Açık ve tamamlanan takipler" },
  { href: "/rehberlik/anketler", icon: FileText, label: "Anket Raporu", desc: "Anket sonuçları ve istatistikler" },
  { href: "/rehberlik/etkinlikler", icon: CalendarDays, label: "Etkinlik Raporu", desc: "Etkinlik ve katılım raporları" },
];

export default async function RehberlikRaporlarPage() {
  const { profile } = await requireAuth();

  if (!canViewGuidance(profile)) {
    return <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Bu sayfaya erişim yetkiniz bulunmamaktadır.</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Rehberlik" title="Raporlar" description="Rehberlik modülü raporları." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {reports.map((r) => (
          <Link key={r.href} href={r.href} className="block">
            <Card className="h-full border-[#e5e7eb] bg-white transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-center gap-3 border-b border-border pb-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-[#eaf1f6]">
                  <r.icon className="size-5 text-[#093657]" aria-hidden />
                </div>
                <div>
                  <CardTitle className="text-sm">{r.label}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <CardDescription className="text-xs">{r.desc}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
