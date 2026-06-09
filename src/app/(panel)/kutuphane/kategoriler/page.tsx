import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireAuth } from "@/lib/auth";
import { canManageCategories } from "@/lib/library/permissions";
import { getCategories } from "@/lib/library/queries";
import { CategoryForm } from "@/components/library/category-form";
import { createCategoryAction } from "@/lib/library/actions";

export default async function KategorilerPage() {
  const { profile } = await requireAuth();

  if (!canManageCategories(profile)) {
    return <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Bu sayfaya erişim yetkiniz bulunmamaktadır.</div>;
  }

  const categories = await getCategories();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Kütüphane"
        title="Kategoriler"
        description="Kitap ve doküman kategorilerini yönetin."
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <CategoryForm action={createCategoryAction} />

        <Card className="bg-white">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-base">Mevcut Kategoriler</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border p-0">
            {categories.length > 0 ? (
              categories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#0f172a]">{cat.name}</p>
                    {cat.description && (
                      <p className="truncate text-xs text-muted-foreground">{cat.description}</p>
                    )}
                  </div>
                  <Badge variant={cat.is_active ? "default" : "outline"}>
                    {cat.is_active ? "Aktif" : "Pasif"}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">Henüz kategori eklenmemiş.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
