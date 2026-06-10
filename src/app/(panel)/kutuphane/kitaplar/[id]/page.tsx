import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth";
import { canManageBooks, canViewLibrary } from "@/lib/library/permissions";
import { getBookById, getLoans } from "@/lib/library/queries";
import { cn } from "@/lib/utils";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function KitapDetayPage({ params }: Props) {
  const { id } = await params;
  const { profile } = await requireAuth();

  if (!canViewLibrary(profile)) {
    return <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Bu sayfaya erişim yetkiniz bulunmamaktadır.</div>;
  }

  const book = await getBookById(id);

  if (!book) {
    notFound();
  }

  const loans = await getLoans(profile, { book_id: id });

  const canManage = await canManageBooks(profile);
  const inLoan = book.total_count - book.available_count;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={book.category?.name ?? "Kitap"}
        title={book.title}
        description={book.author ? `Yazar: ${book.author}` : undefined}
        actions={
          canManage ? (
            <Link href={`/kutuphane/kitaplar/${book.id}/duzenle`} className={cn(buttonVariants({ size: "sm" }))}>
              <Pencil className="size-4" aria-hidden />
              Düzenle
            </Link>
          ) : null
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="bg-white">
          <CardContent className="p-4 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Toplam Nüsha</p>
            <p className="mt-1 text-2xl font-semibold text-[#093657]">{book.total_count}</p>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardContent className="p-4 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Mevcut</p>
            <p className="mt-1 text-2xl font-semibold text-[#093657]">{book.available_count}</p>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardContent className="p-4 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Emanette</p>
            <p className="mt-1 text-2xl font-semibold text-[#093657]">{inLoan}</p>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardContent className="p-4 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Durum</p>
            <Badge variant={book.is_active ? "default" : "outline"} className="mt-1">
              {book.is_active ? "Aktif" : "Pasif"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white">
        <CardHeader className="border-b border-border pb-3">
          <CardTitle className="text-base">Kitap Bilgileri</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
          <InfoItem label="Yazar" value={book.author} />
          <InfoItem label="Yayın Evi" value={book.publisher} />
          <InfoItem label="ISBN" value={book.isbn} />
          <InfoItem label="Yayın Yılı" value={book.publication_year?.toString()} />
          <InfoItem label="Raf Kodu" value={book.shelf_code} />
          <InfoItem label="Konum" value={book.location_note} />
          {book.description && (
            <div className="col-span-full">
              <p className="text-xs text-muted-foreground">Açıklama</p>
              <p className="mt-1 text-sm">{book.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white">
        <CardHeader className="border-b border-border pb-3">
          <CardTitle className="text-base">Emanet Geçmişi</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Alan Kişi</TableHead>
              <TableHead>Tür</TableHead>
              <TableHead>Alış Tarihi</TableHead>
              <TableHead>Son Teslim</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loans.length > 0 ? (
              loans.map((loan) => (
                <TableRow key={loan.id}>
                  <TableCell className="font-medium">{loan.student?.full_name ?? loan.profile?.full_name ?? "-"}</TableCell>
                  <TableCell>{loan.borrower_type === "student" ? "Talebe" : "Personel"}</TableCell>
                  <TableCell>{loan.loan_date}</TableCell>
                  <TableCell>{loan.due_date ?? "-"}</TableCell>
                  <TableCell>
                    <LoanStatusBadge status={loan.status} dueDate={loan.due_date} />
                  </TableCell>
                  <TableCell>
                    <Link href={`/kutuphane/emanetler/${loan.id}`} className={cn(buttonVariants({ variant: "ghost", size: "xs" }))}>Detay</Link>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">Henüz emanet kaydı bulunmuyor.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
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

function LoanStatusBadge({ status, dueDate }: { status: string; dueDate: string | null }) {
  if (status === "borrowed" && dueDate && dueDate < new Date().toISOString().split("T")[0]) {
    return <Badge variant="destructive">Gecikti</Badge>;
  }
  if (status === "borrowed") return <Badge variant="secondary">Emanette</Badge>;
  if (status === "returned") return <Badge variant="outline">Teslim Edildi</Badge>;
  if (status === "lost") return <Badge variant="destructive">Kayıp</Badge>;
  return <Badge>{status}</Badge>;
}
