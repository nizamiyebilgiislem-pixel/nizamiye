import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarClock, CheckCircle2, Lock, ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth";
import { canManageGradeSettings } from "@/lib/grades/permissions";
import { getAcademicTermById } from "@/lib/terms/queries";
import { getTermClosurePreview } from "@/lib/terms/snapshots";
import { setCurrentTermAction } from "@/lib/terms/actions";
import { cn } from "@/lib/utils";

type TermDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
};

export default async function TermDetailPage({ params, searchParams }: TermDetailPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { profile } = await requireAuth();
  const term = await getAcademicTermById(id);

  if (!term) {
    notFound();
  }

  const preview = await getTermClosurePreview(term);
  const canManage = canManageGradeSettings(profile);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          eyebrow="Not Sistemi"
          title={term.name}
          description="Dönem bilgileri, aktiflik durumu ve kapanış önizlemesi."
        />
        <Link href="/not-sistemi/donemler" className={cn(buttonVariants({ variant: "outline" }))}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Dönemler
        </Link>
      </div>

      {query.error ? <TermMessage type="error" message={query.error} /> : null}
      {query.success ? <TermMessage type="success" message={query.success} /> : null}

      <Card>
        <CardContent className="grid gap-3 pt-6 md:grid-cols-2 xl:grid-cols-4">
          <Info label="Başlangıç" value={formatDate(term.start_date)} />
          <Info label="Bitiş" value={formatDate(term.end_date)} />
          <Info label="Status" value={term.status} />
          <Info label="Current" value={term.is_current ? "Evet" : "Hayır"} />
          <Info label="Toplam not kaydı" value={String(preview.gradeCount)} />
          <Info label="Toplam kanaat kaydı" value={String(preview.evaluationCount)} />
          <Info label="Snapshot alınacak aktif talebe" value={String(preview.activeStudentCount)} />
          <Info label="Revir kaydı" value={String(preview.infirmaryCount)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dönem İşlemleri</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 pt-0">
          {canManage ? (
            <>
              <form action={setCurrentTermAction}>
                <input type="hidden" name="id" value={term.id} />
                <Button type="submit" variant="secondary" disabled={term.status === "closed" || term.status === "archived" || term.is_current}>
                  <CheckCircle2 className="size-4" aria-hidden="true" />
                  Aktif Yap
                </Button>
              </form>
              <Link href={`/not-sistemi/donemler/${term.id}/kapat`} className={cn(buttonVariants({ variant: "outline" }))}>
                <Lock className="size-4" aria-hidden="true" />
                Dönemi Kapat
              </Link>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">Bu ekran yalnızca bilgi amaçlıdır.</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="size-4" aria-hidden="true" />
            Kapanış Uyarısı
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm leading-6 text-muted-foreground">
            Bu işlem eski verileri silmez. Döneme ait akademik özetleri arşivler ve dönem kapalı hale gelir.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function TermMessage({ type, message }: { type: "error" | "success"; message: string }) {
  return (
    <div
      className={cn(
        "rounded-md border px-3 py-2 text-sm",
        type === "error" ? "border-red-200 bg-red-50 text-red-900" : "border-primary/40 bg-primary/10 text-primary",
      )}
    >
      {message}
    </div>
  );
}

function formatDate(value: string | null) {
  return value ? new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(new Date(value)) : "-";
}
