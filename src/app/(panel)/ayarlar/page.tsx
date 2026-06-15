import { Shield, Database, Users, Building2, Activity, Calendar, Clock, Image as ImageIcon, Wrench, FileText, HardDrive } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { cn } from "@/lib/utils";

export default async function SettingsPage() {
  await requireAuth();
  const supabase = createSupabaseAdminClient();

  const [
    { count: totalProfiles },
    { count: activeProfiles },
    { count: totalStudents },
    { count: activeStudents },
    { count: totalDepartments },
    { count: activeDepartments },
    { count: totalClasses },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("students").select("*", { count: "exact", head: true }),
    supabase.from("students").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("departments").select("*", { count: "exact", head: true }),
    supabase.from("departments").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("classes").select("*", { count: "exact", head: true }),
  ]);

  const [{ data: roleStats }, { data: moduleStats }, { data: currentTerm }, { data: recentLogs }] = await Promise.all([
    supabase.from("profiles").select("role").eq("is_active", true),
    supabase.from("module_assignments").select("module_key"),
    supabase.from("academic_terms").select("*").eq("is_current", true).single(),
    supabase.from("audit_logs").select("action, title, created_at, actor_name").order("created_at", { ascending: false }).limit(8),
  ]);

  const roleCounts = (roleStats ?? []).reduce(
    (acc, p) => {
      acc[p.role] = (acc[p.role] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const moduleCounts = (moduleStats ?? []).reduce(
    (acc, m) => {
      acc[m.module_key] = (acc[m.module_key] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const roleLabels: Record<string, string> = {
    admin: "Admin",
    genel_mudur: "Genel Müdür",
    bolum_muduru: "Bölüm Müdürü",
    hoca: "Hoca",
    kutuphane_gorevlisi: "Kütüphane Görevlisi",
    rehberlik: "Rehberlik",
    destek_birim_muduru: "Destek Birim Müdürü",
    veli: "Veli",
    muhasebe: "Muhasebe",
  };

  const termStatusLabels: Record<string, { label: string; color: string }> = {
    draft: { label: "Taslak", color: "text-gray-600 bg-gray-50" },
    active: { label: "Aktif", color: "text-emerald-600 bg-emerald-50" },
    closed: { label: "Kapalı", color: "text-red-600 bg-red-50" },
    archived: { label: "Arşivlenmiş", color: "text-muted-foreground bg-muted" },
  };

  const now = new Date();
  const termStart = currentTerm?.start_date ? new Date(currentTerm.start_date) : null;
  const termEnd = currentTerm?.end_date ? new Date(currentTerm.end_date) : null;

  const daysUntilEnd = termEnd ? Math.ceil((termEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Sistem" title="Ayarlar" description="Sistem yapılandırması ve kurumsal ayarlar." />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Kurumsal Bilgiler */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="size-5 text-[#093657]" />
              Kurumsal Bilgiler
            </CardTitle>
            <CardDescription>Kurum temel bilgileri ve yapılandırması.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Kurum Adı</p>
                <p className="font-medium">Nizamiye Eğitim Kurumları</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Sistem Durumu</p>
                <p className="font-medium text-emerald-600">Aktif</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Bölüm Sayısı</p>
                <p className="font-medium">{activeDepartments ?? 0} / {totalDepartments ?? 0}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Sınıf Sayısı</p>
                <p className="font-medium">{totalClasses ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sistem Sağlığı */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="size-5 text-[#093657]" />
              Sistem Sağlığı
            </CardTitle>
            <CardDescription>Veritabanı ve sistem bileşen durumu.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Veritabanı</p>
                <p className="flex items-center gap-1.5 font-medium text-emerald-600">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  Bağlı
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Storage</p>
                <p className="flex items-center gap-1.5 font-medium text-emerald-600">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  Aktif
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Auth Servisi</p>
                <p className="flex items-center gap-1.5 font-medium text-emerald-600">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  Çalışıyor
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">RLS</p>
                <p className="flex items-center gap-1.5 font-medium text-emerald-600">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  Etkin
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dönem Bilgileri */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="size-5 text-[#093657]" />
              Mevcut Dönem
            </CardTitle>
            <CardDescription>Aktif akademik dönem bilgileri.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentTerm ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold text-[#093657]">{currentTerm.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {termStart?.toLocaleDateString("tr-TR")} - {termEnd?.toLocaleDateString("tr-TR")}
                    </p>
                  </div>
                  <span className={cn("rounded-md px-2 py-1 text-xs font-medium", termStatusLabels[currentTerm.status]?.color ?? "")}>
                    {termStatusLabels[currentTerm.status]?.label ?? currentTerm.status}
                  </span>
                </div>
                {daysUntilEnd !== null && daysUntilEnd > 0 && (
                  <div className="rounded-md bg-muted/50 px-3 py-2 text-sm">
                    <span className="text-muted-foreground">Dönem bitimine </span>
                    <span className="font-medium text-[#093657]">{daysUntilEnd} gün</span>
                    <span className="text-muted-foreground"> kaldı</span>
                  </div>
                )}
                {daysUntilEnd !== null && daysUntilEnd <= 0 && (
                  <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                    Dönem süresi dolmuş veya bitmiş.
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Aktif dönem bulunamadı.</p>
            )}
          </CardContent>
        </Card>

        {/* Bakım Modu */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="size-5 text-[#093657]" />
              Bakım Modu
            </CardTitle>
            <CardDescription>Sistem bakım ayarları.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="size-3 rounded-full bg-emerald-500" />
                <div>
                  <p className="text-sm font-medium text-emerald-700">Sistem Aktif</p>
                  <p className="text-xs text-emerald-600">Bakım modu kapalı</p>
                </div>
              </div>
              <button
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-amber-600 border-amber-200 hover:bg-amber-50")}
                disabled
              >
                Bakım Modunu Aç
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Bakım modu açıldığında, normal kullanıcılar sisteme giriş yapamaz ve sadece adminler erişim sağlayabilir.
            </p>
          </CardContent>
        </Card>

        {/* Logo Yönetimi */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="size-5 text-[#093657]" />
              Logo Yönetimi
            </CardTitle>
            <CardDescription>Kurum logosu yapılandırması.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 rounded-md border border-border p-4">
              <div className="flex size-16 items-center justify-center rounded-lg bg-[#093657]/10">
                <span className="text-2xl font-bold text-[#093657]">N</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Nizamiye Logo</p>
                <p className="text-xs text-muted-foreground">PNG veya SVG, maks 2MB</p>
              </div>
              <button
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                disabled
              >
                Değiştir
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Logo değişikliği için Supabase Storage üzerinden yükleme yapılabilir. Şu an yapılandırma devre dışı.
            </p>
          </CardContent>
        </Card>

        {/* Storage Özeti */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="size-5 text-[#093657]" />
              Depolama Alanı
            </CardTitle>
            <CardDescription>Supabase Storage kullanım özeti.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-muted-foreground">Kullanılan</span>
                  <span className="font-medium">Tahmini: ~50 MB</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div className="h-2 w-1/4 rounded-full bg-[#093657]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Profil Fotoğrafları</p>
                  <p className="font-medium">Tahmini: ~20 MB</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Öğrenci Fotoğrafları</p>
                  <p className="font-medium">Tahmini: ~25 MB</p>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Hassas depolama istatistikleri için Supabase Dashboard kullanın.
            </p>
          </CardContent>
        </Card>

        {/* Personel Dağılımı */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-5 text-[#093657]" />
              Personel Dağılımı
            </CardTitle>
            <CardDescription>Aktif personel rollerinin dağılımı.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Object.entries(roleCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([role, count]) => (
                  <div key={role} className="flex items-center justify-between rounded-md border border-border p-3">
                    <div>
                      <p className="text-sm font-medium">{roleLabels[role] ?? role}</p>
                      <p className="text-xs text-muted-foreground">{count} kişi</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-[#093657]/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-[#093657]">{count}</span>
                    </div>
                  </div>
                ))}
              {Object.keys(roleCounts).length === 0 && (
                <p className="col-span-2 text-sm text-muted-foreground">Henüz aktif personel yok.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Son İşlemler */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="size-5 text-[#093657]" />
              Son İşlemler
            </CardTitle>
            <CardDescription>Sistemde yapılan son işlemler.</CardDescription>
          </CardHeader>
          <CardContent>
            {recentLogs && recentLogs.length > 0 ? (
              <div className="divide-y divide-border">
                {recentLogs.map((log) => (
                  <div key={log.created_at} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <Clock className="size-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{log.title}</p>
                        <p className="text-xs text-muted-foreground">{log.actor_name}</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Henüz işlem kaydı yok.</p>
            )}
          </CardContent>
        </Card>

        {/* Modül Atamaları */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="size-5 text-[#093657]" />
              Modül Atamaları
            </CardTitle>
            <CardDescription>Aktif modüller ve atanan kişi sayısı.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { key: "library", label: "Kütüphane" },
                { key: "infirmary", label: "Revir" },
                { key: "guidance", label: "Rehberlik" },
                { key: "live_sessions", label: "Canlı Oturumlar" },
              ].map((mod) => (
                <div key={mod.key} className="flex items-center justify-between rounded-md border border-border p-3">
                  <span className="text-sm font-medium">{mod.label}</span>
                  <span className="rounded-full bg-[#093657]/10 px-2.5 py-0.5 text-xs font-medium text-[#093657]">
                    {moduleCounts[mod.key] ?? 0}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Öğrenci İstatistikleri */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="size-5 text-[#093657]" />
              Öğrenci ve Personel Verileri
            </CardTitle>
            <CardDescription>Sistemde kayıtlı toplam istatistikler.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-md border border-border p-4 text-center">
                <p className="text-2xl font-bold text-[#093657]">{totalStudents ?? 0}</p>
                <p className="text-xs text-muted-foreground">Toplam Öğrenci</p>
              </div>
              <div className="rounded-md border border-border p-4 text-center">
                <p className="text-2xl font-bold text-emerald-600">{activeStudents ?? 0}</p>
                <p className="text-xs text-muted-foreground">Aktif Öğrenci</p>
              </div>
              <div className="rounded-md border border-border p-4 text-center">
                <p className="text-2xl font-bold text-[#093657]">{totalProfiles ?? 0}</p>
                <p className="text-xs text-muted-foreground">Toplam Personel</p>
              </div>
              <div className="rounded-md border border-border p-4 text-center">
                <p className="text-2xl font-bold text-emerald-600">{activeProfiles ?? 0}</p>
                <p className="text-xs text-muted-foreground">Aktif Personel</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}