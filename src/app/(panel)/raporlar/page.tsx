import { BarChart3, FileText, GraduationCap, Printer, School, UsersRound } from "lucide-react";
import type { ComponentType } from "react";

import { ReportShortcutCard } from "@/components/reports/report-shortcut-card";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth";
import { getDashboardData } from "@/lib/dashboard/queries";
import { getActiveTerms } from "@/lib/terms/queries";

export default async function ReportsPage() {
  const { profile } = await requireAuth();
  const [dashboard, activeTerms] = await Promise.all([getDashboardData(profile), getActiveTerms()]);
  const activeTerm = activeTerms[0] ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Yönetim"
        title="Raporlar"
        description="Kurum çıktılarını, resmi PDF görünümünü ve dönemsel özetleri tek merkezden yönetin."
      />

      <Card size="sm" className="border-[#093657]/15 bg-white">
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Aktif dönem</p>
            <p className="text-xl font-semibold text-[#093657]">{activeTerm?.name ?? "Aktif dönem tanımlı değil"}</p>
          </div>
          <p className="max-w-2xl text-sm text-muted-foreground">
            PDF çıktıları bu dönem verileri ve yetki kapsamına göre hazırlanır. Resmi çıktı almak için ilgili rapor ekranını açın.
          </p>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-[#093657]">PDF Merkezi</h2>
          <p className="text-sm text-muted-foreground">Bireysel ve kurumsal PDF çıktılarına buradan erişin.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <ReportShortcutCard
            title="Talebe PDF Merkezi"
            description="Bilgi formu, not dökümü, kanaat ve revir geçmişi."
            href="/raporlar/talebeler"
            badge="Bireysel"
          />
          <ReportShortcutCard
            title="Sınıf PDF Merkezi"
            description="Sınıf listesi, ders programı ve yoklama çıktıları."
            href="/raporlar/siniflar"
            badge="Sınıf"
          />
          <ReportShortcutCard
            title="Bölüm PDF Merkezi"
            description="Bölüm raporu, doluluk, başarı ve sınıf özetleri."
            href="/raporlar/bolumler"
            badge="Bölüm"
          />
        </div>
      </section>

      <section className="space-y-3">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-[#093657]">Rapor Kategorileri</h2>
          <p className="text-sm text-muted-foreground">Resmi çıktıları konu bazında ayırın ve yazdırın.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Shortcut icon={GraduationCap} title="Notlar" href="/raporlar/notlar" description="Dönemsel not dökümleri ve başarı özetleri." />
          <Shortcut icon={FileText} title="Kanaatler" href="/raporlar/kanaatler" description="Kanaat kayıtları ve öğretmen yorumları." />
          <Shortcut icon={UsersRound} title="Revir" href="/raporlar/revir" description="Sağlık kayıtları ve geçmiş işlemler." />
          <Shortcut icon={BarChart3} title="Yoklama" href="/raporlar/yoklama" description="Günlük yoklama raporları ve aylık özetler." />
          <Shortcut icon={School} title="Namaz Yoklama" href="/raporlar/namaz-yoklama" description="Sabah, öğle, ikindi, akşam ve yatsı raporları." />
          <Shortcut icon={Printer} title="Dönem Sonu" href="/raporlar/donem-sonu" description="Başarı, devamsızlık ve dönem sonu akademik özet." />
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {dashboard.metrics.slice(0, 4).map((metric) => (
          <Card key={metric.key} size="sm" className="bg-white">
            <CardContent className="p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{metric.label}</p>
              <p className="mt-2 text-2xl font-semibold text-[#093657]">{metric.value.toLocaleString("tr-TR")}</p>
              <p className="mt-1 text-xs text-muted-foreground">{metric.description}</p>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}

function Shortcut({
  icon: Icon,
  title,
  href,
  description,
}: {
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
  href: string;
  description: string;
}) {
  return (
    <ReportShortcutCard
      title={title}
      description={description}
      href={href}
      className="border-[#093657]/10"
      badge={<Icon className="size-4" aria-hidden={true} />}
    />
  );
}
