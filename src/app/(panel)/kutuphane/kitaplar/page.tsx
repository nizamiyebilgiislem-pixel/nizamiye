import Link from "next/link";
import { Plus, Search } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Pagination } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { requireAuth } from "@/lib/auth";
import { canManageBooks, canViewLibrary } from "@/lib/library/permissions";
import { getBooks, getActiveCategories } from "@/lib/library/queries";
import { cn } from "@/lib/utils";

type Props = {
  searchParams: Promise<{ search?: string; category_id?: string; is_active?: string; available?: string; page?: string }>;
};

export default async function KitaplarPage({ searchParams }: Props) {
  const { profile } = await requireAuth();
  const filters = await searchParams;
  const page = Number(filters.page) || 1;

  if (!canViewLibrary(profile)) {
    return <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Bu sayfaya erişim yetkiniz bulunmamaktadır.</div>;
  }

  const [{ books, totalCount }, categories] = await Promise.all([
    getBooks(profile, {
      search: filters.search,
      category_id: filters.category_id,
      is_active: filters.is_active !== "false",
      available: filters.available === "true",
    }, page),
    getActiveCategories(),
  ]);

  const pageSize = 20;
  const totalPages = Math.ceil(totalCount / pageSize);
  const canManage = await canManageBooks(profile);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Kütüphane"
        title="Kitaplar"
        description="Tüm kitap kayıtları."
        actions={
          canManage ? (
            <Link href="/kutuphane/kitaplar/yeni" className={cn(buttonVariants({ size: "sm" }))}>
              <Plus className="size-4" aria-hidden />
              Yeni Kitap
            </Link>
          ) : null
        }
      />

      <Card className="bg-white">
        <CardContent className="p-4">
          <form className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input name="search" defaultValue={filters.search ?? ""} placeholder="Kitap adı, yazar veya ISBN ara..." className="pl-9" />
            </div>
            <NativeSelect
              name="category_id"
              defaultValue={filters.category_id ?? ""}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-ring"
            >
              <option value="">Tüm Kategoriler</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </NativeSelect>
            <NativeSelect
              name="available"
              defaultValue={filters.available ?? ""}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-ring"
            >
              <option value="">Tümü</option>
              <option value="true">Müsait</option>
              <option value="false">Emanette</option>
            </NativeSelect>
            <Button type="submit" variant="secondary" size="sm">Filtrele</Button>
            {(filters.search || filters.category_id || filters.available) && (
              <Link href="/kutuphane/kitaplar" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>Temizle</Link>
            )}
          </form>
        </CardContent>
      </Card>

      <Card className="bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kitap Adı</TableHead>
              <TableHead>Yazar</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Raf/Konum</TableHead>
              <TableHead className="text-center">Toplam</TableHead>
              <TableHead className="text-center">Mevcut</TableHead>
              <TableHead className="text-center">Emanette</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {books.length > 0 ? (
              books.map((book) => {
                const inLoan = book.total_count - book.available_count;
                return (
                  <TableRow key={book.id}>
                    <TableCell className="font-medium">{book.title}</TableCell>
                    <TableCell className="text-muted-foreground">{book.author ?? "-"}</TableCell>
                    <TableCell>{book.category?.name ?? "-"}</TableCell>
                    <TableCell className="text-muted-foreground">{book.shelf_code ?? book.location_note ?? "-"}</TableCell>
                    <TableCell className="text-center">{book.total_count}</TableCell>
                    <TableCell className="text-center">{book.available_count}</TableCell>
                    <TableCell className="text-center">{inLoan}</TableCell>
                    <TableCell>
                      <Badge variant={book.is_active ? "default" : "outline"}>
                        {book.is_active ? "Aktif" : "Pasif"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Link href={`/kutuphane/kitaplar/${book.id}`} className={cn(buttonVariants({ variant: "ghost", size: "xs" }))}>Detay</Link>
                        {canManage && (
                          <Link href={`/kutuphane/kitaplar/${book.id}/duzenle`} className={cn(buttonVariants({ variant: "ghost", size: "xs" }))}>Düzenle</Link>
                        )}
                        {canManage && book.available_count > 0 && (
                          <Link href={`/kutuphane/emanetler/yeni?book_id=${book.id}`} className={cn(buttonVariants({ variant: "ghost", size: "xs" }))}>Emanet Ver</Link>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                  {filters.search || filters.category_id ? "Aramanızla eşleşen kitap bulunamadı." : "Henüz kitap eklenmemiş."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Pagination currentPage={page} totalPages={totalPages} basePath="/kutuphane/kitaplar" searchParams={filters} />
    </div>
  );
}
