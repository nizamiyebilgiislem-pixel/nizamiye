import Link from "next/link";
import { Plus, Search } from "lucide-react";

import { CsvExportButton } from "@/components/export/csv-export-button";
import { PageHeader } from "@/components/layout/page-header";
import { Pagination } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { requireAuth } from "@/lib/auth";
import { canManageLoans, canViewLibrary } from "@/lib/library/permissions";
import { getLoans } from "@/lib/library/queries";
import { cn } from "@/lib/utils";

type Props = {
  searchParams: Promise<{ q?: string; status?: string; overdue?: string; student_id?: string; profile_id?: string; book_id?: string; page?: string }>;
};

export default async function EmanetlerPage({ searchParams }: Props) {
  const { profile } = await requireAuth();
  const filters = await searchParams;
  const page = Number(filters.page) || 1;

  if (!canViewLibrary(profile)) {
    return <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Bu sayfaya erişim yetkiniz bulunmamaktadır.</div>;
  }

  const { loans, totalCount } = await getLoans(profile, {
    search: filters.q,
    status: filters.status,
    overdue: filters.overdue === "true" ? true : undefined,
    student_id: filters.student_id,
    profile_id: filters.profile_id,
    book_id: filters.book_id,
  }, page);

  const pageSize = 20;
  const totalPages = Math.ceil(totalCount / pageSize);
  const canManage = await canManageLoans(profile);
  const today = new Date().toISOString().split("T")[0];
  const csvData = loans.map((l) => {
    const isOverdue = l.status === "borrowed" && l.due_date && l.due_date < today;
    return {
      "Kitap": l.book?.title ?? "Kitap silinmiş",
      "Alan Kişi": l.student?.full_name ?? l.profile?.full_name ?? "-",
      "Tür": l.borrower_type === "student" ? "Talebe" : "Personel",
      "Alış Tarihi": l.loan_date,
      "Son Teslim": l.due_date ?? "-",
      "Durum": l.status === "borrowed" ? "Emanette" : l.status === "returned" ? "Teslim Edildi" : "Kayıp",
      "Gecikme": isOverdue ? `${Math.ceil((new Date(today).getTime() - new Date(l.due_date!).getTime()) / (1000 * 60 * 60 * 24))} gün` : "-",
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Kütüphane"
        title="Emanetler"
        description="Tüm kitap emanet kayıtları."
        actions={
          <div className="flex flex-wrap gap-2">
            <CsvExportButton data={csvData} filename="emanetler" />
            {canManage ? (
              <Link href="/kutuphane/emanetler/yeni" className={cn(buttonVariants({ size: "sm" }))}>
                <Plus className="size-4" aria-hidden />
                Yeni Emanet
              </Link>
            ) : null}
          </div>
        }
      />

      <Card className="bg-white">
        <CardContent className="p-4">
          <form className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input name="q" defaultValue={filters.q ?? ""} placeholder="Kitap adı, alan kişi ara..." className="pl-9" />
            </div>
            <NativeSelect
              name="status"
              defaultValue={filters.status ?? ""}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-ring"
            >
              <option value="">Tüm Durumlar</option>
              <option value="borrowed">Emanette</option>
              <option value="returned">Teslim Edildi</option>
              <option value="lost">Kayıp</option>
            </NativeSelect>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="overdue" value="true" defaultChecked={filters.overdue === "true"} className="rounded border-border" />
              Sadece Gecikenler
            </label>
            <Button type="submit" variant="secondary" size="sm">Filtrele</Button>
            {(filters.q || filters.status || filters.overdue) && (
              <Link href="/kutuphane/emanetler" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>Temizle</Link>
            )}
          </form>
        </CardContent>
      </Card>

      <Card className="bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kitap</TableHead>
              <TableHead>Alan Kişi</TableHead>
              <TableHead>Tür</TableHead>
              <TableHead>Alış Tarihi</TableHead>
              <TableHead>Son Teslim</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Gecikme</TableHead>
              <TableHead>İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loans.length > 0 ? (
              loans.map((loan) => {
                const isOverdue = loan.status === "borrowed" && loan.due_date && loan.due_date < today;
                return (
                  <TableRow key={loan.id}>
                    <TableCell className="font-medium">{loan.book?.title ?? "Kitap silinmiş"}</TableCell>
                    <TableCell>{loan.student?.full_name ?? loan.profile?.full_name ?? "-"}</TableCell>
                    <TableCell>{loan.borrower_type === "student" ? "Talebe" : "Personel"}</TableCell>
                    <TableCell>{loan.loan_date}</TableCell>
                    <TableCell>{loan.due_date ?? "-"}</TableCell>
                    <TableCell>
                      <LoanStatusBadge status={loan.status} />
                    </TableCell>
                    <TableCell>
                      {isOverdue ? (
                        <Badge variant="destructive">
                          {Math.ceil((new Date(today).getTime() - new Date(loan.due_date!).getTime()) / (1000 * 60 * 60 * 24))} gün
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Link href={`/kutuphane/emanetler/${loan.id}`} className={cn(buttonVariants({ variant: "ghost", size: "xs" }))}>Detay</Link>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  {filters.q || filters.status || filters.overdue ? "Aramanızla eşleşen emanet bulunamadı." : "Henüz emanet kaydı bulunmuyor."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Pagination currentPage={page} totalPages={totalPages} basePath="/kutuphane/emanetler" searchParams={filters} />
    </div>
  );
}

function LoanStatusBadge({ status }: { status: string }) {
  if (status === "borrowed") return <Badge variant="secondary">Emanette</Badge>;
  if (status === "returned") return <Badge variant="outline">Teslim Edildi</Badge>;
  if (status === "lost") return <Badge variant="destructive">Kayıp</Badge>;
  return <Badge>{status}</Badge>;
}
