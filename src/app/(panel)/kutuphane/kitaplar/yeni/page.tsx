import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth";
import { canManageBooks } from "@/lib/library/permissions";
import { getActiveCategories } from "@/lib/library/queries";
import { BookForm } from "@/components/library/book-form";
import { createBookAction } from "@/lib/library/actions";

export default async function YeniKitapPage() {
  const { profile } = await requireAuth();

  if (!canManageBooks(profile)) {
    return <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Bu işlem için yetkiniz bulunmamaktadır.</div>;
  }

  const categories = await getActiveCategories();

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Kütüphane" title="Yeni Kitap" description="Yeni bir kitap kaydı oluşturun." />
      <BookForm action={createBookAction} title="Kitap Bilgileri" description="Kitap detaylarını girin." categories={categories} />
    </div>
  );
}
