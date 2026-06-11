import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AlertTriangle, ArrowLeft, Lock } from "lucide-react";

import { closeTermAction } from "@/lib/terms/actions";
import { requireAuth } from "@/lib/auth";
import { canManageGradeSettings } from "@/lib/grades/permissions";
import { getAcademicTermById } from "@/lib/terms/queries";
import { getTermClosurePreview } from "@/lib/terms/snapshots";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type CloseTermPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function CloseTermPage({ params, searchParams }: CloseTermPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { profile } = await requireAuth();

  if (!canManageGradeSettings(profile)) {
    redirect("/not-sistemi/donemler?error=unauthorized");
  }

  const term = await getAcademicTermById(id);

  if (!term) {
    notFound();
  }

  const preview = await getTermClosurePreview(term);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          eyebrow="Not Sistemi"
          title="Dönemi Kapat ve Arşivle"
          description={`${term.name} dönemi için snapshot alınacak ve dönem kapatılacak.`}
        />
        <Link href={`/not-sistemi/donemler/${term.id}`} className={cn(buttonVariants({ variant: "outline" }))}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Geri Dön
        </Link>
      </div>

      {query.error ? <Message type="error" message={query.error} /> : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-amber-600" aria-hidden="true" />
            Uyarı
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm leading-6 text-muted-foreground">
            Bu işlem eski verileri silmez. Döneme ait akademik özetleri arşivler ve dönem kapalı hale gelir.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-3 pt-6 md:grid-cols-2 xl:grid-cols-4">
          <Info label="Toplam not kaydı" value={String(preview.gradeCount)} />
          <Info label="Toplam kanaat kaydı" value={String(preview.evaluationCount)} />
          <Info label="Snapshot alınacak aktif talebe" value={String(preview.activeStudentCount)} />
          <Info label="Revir kaydı" value={String(preview.infirmaryCount)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dönemi Kapatma</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-3 pt-0">
          <div className="text-sm text-muted-foreground">
            <p>Dönem: <span className="font-medium text-foreground">{term.name}</span></p>
            <p>Bu işlem idempotent olarak çalışır; snapshot kayıtları upsert edilir.</p>
          </div>
          <form action={closeTermAction}>
            <input type="hidden" name="id" value={term.id} />
            <FormSubmitButton className="bg-[#093657] text-white hover:bg-[#082b46]">
              <Lock className="size-4" aria-hidden="true" />
              Dönemi Kapat ve Arşivle
            </FormSubmitButton>
          </form>
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

function Message({ type, message }: { type: "error" | "success"; message: string }) {
  return (
    <div className={cn("rounded-md border px-3 py-2 text-sm", type === "error" ? "border-red-200 bg-red-50 text-red-900" : "border-primary/40 bg-primary/10 text-primary")}>
      {message}
    </div>
  );
}
