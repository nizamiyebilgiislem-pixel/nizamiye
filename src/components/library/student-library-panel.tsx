import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { LoanWithBook } from "@/lib/library/queries";

type StudentLibraryPanelProps = {
  loans: LoanWithBook[];
};

export function StudentLibraryPanel({ loans }: StudentLibraryPanelProps) {
  const today = new Date().toISOString().split("T")[0];
  const activeLoans = loans.filter((l) => l.status === "borrowed");
  const overdueLoans = activeLoans.filter((l) => l.due_date && l.due_date < today);

  return (
    <div className="space-y-4">
      {activeLoans.length > 0 && (
        <Card className="bg-white">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-base">Aktif Emanetler ({activeLoans.length})</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border p-0">
            {activeLoans.map((loan) => {
              const isOverdue = loan.due_date && loan.due_date < today;
              return (
                <Link key={loan.id} href={`/kutuphane/emanetler/${loan.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-[#f8fafc]">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#0f172a]">{loan.book?.title ?? "Kitap silinmiş"}</p>
                    <p className="text-xs text-muted-foreground">
                      {loan.loan_date} · {loan.due_date ? `Son: ${loan.due_date}` : "Süresiz"}
                    </p>
                  </div>
                  {isOverdue ? <Badge variant="destructive">Gecikti</Badge> : <Badge variant="secondary">Emanette</Badge>}
                </Link>
              );
            })}
          </CardContent>
        </Card>
      )}

      {activeLoans.length === 0 && loans.length === 0 && (
        <Card className="bg-white">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Bu talebenin kütüphane kaydı bulunmamaktadır.
          </CardContent>
        </Card>
      )}

      {loans.length > 0 && (
        <Card className="bg-white">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-base">Geçmiş Emanetler</CardTitle>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kitap</TableHead>
                <TableHead>Alış Tarihi</TableHead>
                <TableHead>Son Teslim</TableHead>
                <TableHead>Durum</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loans.filter((l) => l.status !== "borrowed").length > 0 ? (
                loans.filter((l) => l.status !== "borrowed").map((loan) => (
                  <TableRow key={loan.id}>
                    <TableCell className="font-medium">{loan.book?.title ?? "Kitap silinmiş"}</TableCell>
                    <TableCell>{loan.loan_date}</TableCell>
                    <TableCell>{loan.due_date ?? "-"}</TableCell>
                    <TableCell>
                      {loan.status === "returned" ? (
                        <Badge variant="outline">Teslim Edildi</Badge>
                      ) : (
                        <Badge variant="destructive">Kayıp</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                    {activeLoans.length > 0
                      ? "Teslim edilmiş kitap bulunmuyor."
                      : "Henüz emanet kaydı bulunmuyor."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {overdueLoans.length > 0 && (
        <Card className="bg-white border-red-200">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-base text-red-700">Geciken Kitaplar ({overdueLoans.length})</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border p-0">
            {overdueLoans.map((loan) => (
              <Link key={loan.id} href={`/kutuphane/emanetler/${loan.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-[#f8fafc]">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#0f172a]">{loan.book?.title ?? "Kitap silinmiş"}</p>
                  <p className="text-xs text-muted-foreground">Son Teslim: {loan.due_date}</p>
                </div>
                <Badge variant="destructive">Gecikti</Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
