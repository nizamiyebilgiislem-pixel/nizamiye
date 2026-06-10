import Link from "next/link";
import { Plus, ExternalLink } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth";
import { canManageDocuments, canViewLibrary } from "@/lib/library/permissions";
import { getDocuments, getActiveCategories } from "@/lib/library/queries";
import { cn } from "@/lib/utils";

type Props = {
  searchParams: Promise<{ category_id?: string; document_type?: string }>;
};

export default async function DokumanlarPage({ searchParams }: Props) {
  const { profile } = await requireAuth();
  const filters = await searchParams;

  if (!canViewLibrary(profile)) {
    return <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Bu sayfaya erişim yetkiniz bulunmamaktadır.</div>;
  }

  const [documents, categories] = await Promise.all([
    getDocuments(profile, { category_id: filters.category_id, document_type: filters.document_type }),
    getActiveCategories(),
  ]);

  const canManage = await canManageDocuments(profile);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Kütüphane"
        title="Dokümanlar"
        description="Dijital doküman arşivi."
        actions={
          canManage ? (
            <Link href="/kutuphane/dokumanlar/yeni" className={cn(buttonVariants({ size: "sm" }))}>
              <Plus className="size-4" aria-hidden />
              Doküman Ekle
            </Link>
          ) : null
        }
      />

      <Card className="bg-white">
        <CardContent className="p-4">
          <form className="flex flex-wrap gap-3">
            <select
              name="category_id"
              defaultValue={filters.category_id ?? ""}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-ring"
            >
              <option value="">Tüm Kategoriler</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <select
              name="document_type"
              defaultValue={filters.document_type ?? ""}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-ring"
            >
              <option value="">Tüm Türler</option>
              <option value="pdf">PDF</option>
              <option value="word">Word</option>
              <option value="excel">Excel</option>
              <option value="image">Görsel</option>
              <option value="other">Diğer</option>
            </select>
            <button type="submit" className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}>Filtrele</button>
            {(filters.category_id || filters.document_type) && (
              <Link href="/kutuphane/dokumanlar" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>Temizle</Link>
            )}
          </form>
        </CardContent>
      </Card>

      <Card className="bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Başlık</TableHead>
              <TableHead>Tür</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Dosya Adı</TableHead>
              <TableHead>Yükleyen</TableHead>
              <TableHead>Tarih</TableHead>
              <TableHead>İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.length > 0 ? (
              documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">{doc.title}</TableCell>
                  <TableCell>
                    <DocTypeBadge type={doc.document_type} />
                  </TableCell>
                  <TableCell>{doc.category?.name ?? "-"}</TableCell>
                  <TableCell className="text-muted-foreground max-w-[200px] truncate">{doc.file_name ?? "-"}</TableCell>
                  <TableCell>{doc.uploader?.full_name ?? "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{new Date(doc.created_at).toLocaleDateString("tr-TR")}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className={cn(buttonVariants({ variant: "ghost", size: "xs" }))}
                      >
                        <ExternalLink className="size-3" aria-hidden />
                        Görüntüle
                      </a>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">Henüz doküman yüklenmemiş.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function DocTypeBadge({ type }: { type: string | null }) {
  if (type === "pdf") return <Badge variant="destructive">PDF</Badge>;
  if (type === "word") return <Badge variant="secondary">Word</Badge>;
  if (type === "excel") return <Badge variant="secondary">Excel</Badge>;
  if (type === "image") return <Badge>Görsel</Badge>;
  return <Badge variant="outline">Diğer</Badge>;
}
