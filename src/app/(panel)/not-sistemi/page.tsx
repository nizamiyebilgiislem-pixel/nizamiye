import Link from "next/link";
import { BookOpen, CalendarDays, ClipboardPen, Layers } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth";
import { getGradeDashboardSummary } from "@/lib/grades/queries";
import { cn } from "@/lib/utils";

export default async function GradesDashboardPage() {
  const { profile } = await requireAuth();
  const summary = await getGradeDashboardSummary(profile);
  const canManageAcademicTerms = profile.role === "admin" || profile.role === "genel_mudur";

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Not Sistemi" title="Not Sistemi" description="Ders, dönem ve sınav giriş süreçlerini yönetin." />
      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard icon={BookOpen} label="Aktif Ders" value={summary.activeCourseCount} />
        <SummaryCard icon={CalendarDays} label="Aktif Dönem" value={summary.activeTermCount} />
        <SummaryCard icon={ClipboardPen} label="Toplam Not Kaydı" value={summary.gradeCount} />
      </section>
      <Card>
        <CardHeader><CardTitle>Bölümlere Göre Ders Sayısı</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {summary.departmentCourseCounts.map((item) => (
            <div key={item.departmentName} className="rounded-md border border-border bg-background p-3">
              <p className="text-sm text-muted-foreground">{item.departmentName}</p>
              <p className="mt-1 text-2xl font-semibold">{item.count}</p>
            </div>
          ))}
        </CardContent>
      </Card>
      <div className="flex flex-wrap gap-2">
        <Link href="/not-sistemi/dersler" className={cn(buttonVariants({ variant: "secondary" }))}>Dersler</Link>
        {canManageAcademicTerms ? (
          <Link href="/sistem/donem-yonetimi" className={cn(buttonVariants({ variant: "secondary" }))}>Dönem Yönetimi</Link>
        ) : (
          <Link href="/not-sistemi/donemler" className={cn(buttonVariants({ variant: "secondary" }))}>Dönemler</Link>
        )}
        {profile.role !== "destek_birim_muduru" ? <Link href="/not-sistemi/not-girisi" className={cn(buttonVariants())}>Sınav Girişi</Link> : null}
        <Link href="/egitim-planlama" className={cn(buttonVariants({ variant: "outline" }))}>Eğitim Planlama</Link>
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value }: { icon: typeof Layers; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-5">
        <Icon className="size-5 text-primary" aria-hidden="true" />
        <p className="mt-4 text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-3xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
