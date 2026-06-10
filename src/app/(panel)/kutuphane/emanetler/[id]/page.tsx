import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants, Button } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth";
import { canManageLoans, canViewLibrary } from "@/lib/library/permissions";
import { getLoanById } from "@/lib/library/queries";
import { returnLoanAction, markLoanLostAction } from "@/lib/library/actions";
import { cn } from "@/lib/utils";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EmanetDetayPage({ params }: Props) {
  const { id } = await params;
  const { profile } = await requireAuth();

  if (!canViewLibrary(profile)) {
    return <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Bu sayfaya erişim yetkiniz bulunmamaktadır.</div>;
  }

  const loan = await getLoanById(id);

  if (!loan) {
    notFound();
  }

  const canManage = await canManageLoans(profile);
  const today = new Date().toISOString().split("T")[0];
  const isOverdue = loan.status === "borrowed" && loan.due_date && loan.due_date < today;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Emanet"
        title={loan.book?.title ?? "Kitap silinmiş"}
        description={`${loan.borrower_type === "student" ? "Talebe" : "Personel"} · ${loan.student?.full_name ?? loan.profile?.full_name ?? "Bilinmiyor"}`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card className="bg-white">
          <CardContent className="p-4 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Durum</p>
            <div className="mt-1">
              <StatusBadge status={loan.status} />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardContent className="p-4 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Alış Tarihi</p>
            <p className="mt-1 text-lg font-semibold text-[#093657]">{loan.loan_date}</p>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardContent className="p-4 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Son Teslim</p>
            <p className={cn("mt-1 text-lg font-semibold", isOverdue ? "text-red-600" : "text-[#093657]")}>
              {loan.due_date ?? "-"}
            </p>
            {isOverdue && <p className="mt-0.5 text-xs text-red-600">Gecikti</p>}
          </CardContent>
        </Card>
      </div>

      {loan.returned_at && (
        <Card className="bg-white">
          <CardContent className="p-4 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Teslim Tarihi</p>
            <p className="mt-1 text-lg font-semibold text-[#093657]">{loan.returned_at}</p>
          </CardContent>
        </Card>
      )}

      <Card className="bg-white">
        <CardHeader className="border-b border-border pb-3">
          <CardTitle className="text-base">Emanet Bilgileri</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 p-4 sm:grid-cols-2">
          <InfoItem label="Kitap" value={loan.book?.title} />
          <InfoItem label="Alan Kişi" value={loan.student?.full_name ?? loan.profile?.full_name} />
          <InfoItem label="Tür" value={loan.borrower_type === "student" ? "Talebe" : "Personel/Hoca"} />
          <InfoItem label="Veren" value={loan.given_by_profile?.full_name} />
          <InfoItem label="Teslim Alan" value={loan.received_by_profile?.full_name} />
          {loan.note && <InfoItem label="Not" value={loan.note} />}
        </CardContent>
      </Card>

      {canManage && loan.status === "borrowed" && (
        <div className="flex flex-wrap gap-3">
          <form action={returnLoanAction.bind(null, undefined) as unknown as (formData: FormData) => Promise<void>}>
            <input type="hidden" name="loan_id" value={loan.id} />
            <Button type="submit" variant="default">Teslim Al</Button>
          </form>
          <form action={markLoanLostAction.bind(null, undefined) as unknown as (formData: FormData) => Promise<void>}>
            <input type="hidden" name="loan_id" value={loan.id} />
            <Button type="submit" variant="destructive">Kayıp İşaretle</Button>
          </form>
        </div>
      )}

      {loan.status !== "borrowed" && (
        <div className="flex flex-wrap gap-3">
          <Link href={`/kutuphane/kitaplar/${loan.book_id}`} className={cn(buttonVariants({ variant: "outline" }))}>Kitaba Git</Link>
        </div>
      )}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="rounded-md border border-border bg-[#f8fafc] p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value || "-"}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "borrowed") return <Badge variant="secondary">Emanette</Badge>;
  if (status === "returned") return <Badge variant="outline">Teslim Edildi</Badge>;
  if (status === "lost") return <Badge variant="destructive">Kayıp</Badge>;
  return <Badge>{status}</Badge>;
}
