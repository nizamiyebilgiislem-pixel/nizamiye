import Link from "next/link";
import { BookOpen, FileText, Plus, BookMarked, BarChart3 } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth";
import { canManageBooks, canViewLibrary } from "@/lib/library/permissions";
import { getLibraryDashboardData, getRecentBooks, getActiveLoans, getOverdueLoans, getCategoryBookCounts } from "@/lib/library/queries";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default async function LibraryPage() {
  const { profile } = await requireAuth();
  const canManage = await canManageBooks(profile);
  const canView = canViewLibrary(profile);

  if (!canView) {
    return <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Bu sayfaya erişim yetkiniz bulunmamaktadır.</div>;
  }

  const [dashboardData, recentBooks, activeLoans, overdueLoans, categoryCounts] = await Promise.all([
    getLibraryDashboardData(),
    getRecentBooks(5),
    getActiveLoans(5),
    getOverdueLoans(10),
    getCategoryBookCounts(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Kütüphane"
        title="Kütüphane Yönetimi"
        description="Kitap, emanet ve doküman takibi."
        actions={
          canManage ? (
            <div className="flex flex-wrap gap-2">
              <Link href="/kutuphane/kitaplar/yeni" className={cn(buttonVariants({ size: "sm" }))}>
                <Plus className="size-4" aria-hidden />
                Yeni Kitap
              </Link>
              <Link href="/kutuphane/emanetler/yeni" className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}>
                <BookMarked className="size-4" aria-hidden />
                Yeni Emanet
              </Link>
              <Link href="/kutuphane/dokumanlar/yeni" className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}>
                <FileText className="size-4" aria-hidden />
                Doküman Ekle
              </Link>
              <Link href="/kutuphane/raporlar" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                <BarChart3 className="size-4" aria-hidden />
                Raporlar
              </Link>
            </div>
          ) : null
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          label="Toplam Kitap"
          value={dashboardData.totalBooks}
          sub={`${dashboardData.totalCopies} nüsha`}
        />
        <SummaryCard
          label="Mevcut Nüsha"
          value={dashboardData.availableCopies}
          sub={`${dashboardData.borrowedCount} emanette`}
        />
        <SummaryCard
          label="Geciken Emanet"
          value={dashboardData.overdueCount}
          sub={`${dashboardData.totalDocuments} doküman`}
          highlight={dashboardData.overdueCount > 0}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="bg-white">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-base">Son Eklenen Kitaplar</CardTitle>
            <CardDescription>En yeni 5 kitap kaydı.</CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-border p-0">
            {recentBooks.length > 0 ? (
              recentBooks.map((book) => (
                <Link key={book.id} href={`/kutuphane/kitaplar/${book.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-[#f8fafc]">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#0f172a]">{book.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {book.author ?? "Yazar bilinmiyor"} · {book.category?.name ?? "Kategorisiz"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{book.available_count}/{book.total_count}</span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">Henüz kitap eklenmemiş.</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-base">Aktif Emanetler</CardTitle>
            <CardDescription>Son verilen 5 emanet.</CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-border p-0">
            {activeLoans.length > 0 ? (
              activeLoans.map((loan) => (
                <Link key={loan.id} href={`/kutuphane/emanetler/${loan.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-[#f8fafc]">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#0f172a]">{loan.book?.title ?? "Kitap silinmiş"}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {loan.student?.full_name ?? loan.profile?.full_name ?? "Bilinmiyor"}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {loan.due_date && loan.due_date < new Date().toISOString().split("T")[0] ? (
                      <Badge variant="destructive">Gecikti</Badge>
                    ) : (
                      <span>{loan.loan_date}</span>
                    )}
                  </div>
                </Link>
              ))
            ) : (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">Aktif emanet bulunmuyor.</div>
            )}
          </CardContent>
        </Card>
      </div>

      {overdueLoans.length > 0 && (
        <Card className="bg-white">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-base">Geciken Emanetler</CardTitle>
            <CardDescription>{overdueLoans.length} adet gecikmiş emanet bulunuyor.</CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-border p-0">
            {overdueLoans.map((loan) => (
              <Link key={loan.id} href={`/kutuphane/emanetler/${loan.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-[#f8fafc]">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[#0f172a]">{loan.book?.title ?? "Kitap silinmiş"}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {loan.student?.full_name ?? loan.profile?.full_name ?? "Bilinmiyor"} · {loan.due_date}
                  </p>
                </div>
                <Badge variant="destructive">Gecikti</Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {categoryCounts.length > 0 && (
        <Card className="bg-white">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-base">Kategorilere Göre Dağılım</CardTitle>
            <CardDescription>Kitap sayılarına göre kategoriler.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            {categoryCounts.map((cat) => {
              const maxCount = Math.max(...categoryCounts.map((c) => c.count), 1);
              return (
                <div key={cat.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#0f172a]">{cat.name}</span>
                    <span className="text-muted-foreground">{cat.count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#eaf1f6]">
                    <div className="h-1.5 rounded-full bg-[#093657]" style={{ width: `${Math.max(4, (cat.count / maxCount) * 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SummaryCard({ label, value, sub, highlight }: { label: string; value: number; sub?: string; highlight?: boolean }) {
  return (
    <Card className={cn("border-[#e5e7eb] bg-white", highlight && "border-red-200")}>
      <CardContent className="flex items-center gap-3.5 p-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-[#eaf1f6]">
          <BookOpen className="size-5 text-[#093657]" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className={cn("mt-1 text-2xl font-semibold leading-none", highlight ? "text-red-600" : "text-[#093657]")}>
            {value.toLocaleString("tr-TR")}
          </p>
          {sub && <p className="mt-0.5 truncate text-xs text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
