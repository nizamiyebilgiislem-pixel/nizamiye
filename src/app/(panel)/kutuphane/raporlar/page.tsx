import Link from "next/link";
import { BarChart3, BookOpen, BookMarked, Clock } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth";
import { canViewLibraryReports } from "@/lib/library/permissions";

export default async function RaporlarPage() {
  const { profile } = await requireAuth();

  if (!canViewLibraryReports(profile)) {
    return <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Bu sayfaya erişim yetkiniz bulunmamaktadır.</div>;
  }

  const reports = [
    {
      title: "Tüm Kitap Listesi",
      description: "Tüm aktif kitap kayıtlarını görüntüleyin.",
      href: "/kutuphane/kitaplar",
      icon: BookOpen,
    },
    {
      title: "Emanetteki Kitaplar",
      description: "Aktif emanet durumundaki kitaplar.",
      href: "/kutuphane/emanetler?status=borrowed",
      icon: BookMarked,
    },
    {
      title: "Geciken Kitaplar",
      description: "Süresi geçmiş emanetler.",
      href: "/kutuphane/emanetler?overdue=true",
      icon: Clock,
    },
    {
      title: "Kategorilere Göre Dağılım",
      description: "Kitap sayılarına göre kategori analizi.",
      href: "/kutuphane",
      icon: BarChart3,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Kütüphane"
        title="Raporlar"
        description="Kütüphane raporları ve analizler."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <Link key={report.href} href={report.href} className="block">
              <Card className="h-full border-[#e5e7eb] bg-white transition-shadow hover:shadow-md">
                <CardHeader className="flex flex-row items-center gap-3 border-b border-border pb-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-[#eaf1f6]">
                    <Icon className="size-5 text-[#093657]" aria-hidden />
                  </div>
                  <div>
                    <CardTitle className="text-sm">{report.title}</CardTitle>
                    <CardDescription className="text-xs">{report.description}</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
