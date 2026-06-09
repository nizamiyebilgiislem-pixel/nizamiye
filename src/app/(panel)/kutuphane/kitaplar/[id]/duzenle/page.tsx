import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth";
import { canManageBooks } from "@/lib/library/permissions";
import { getActiveCategories, getBookById } from "@/lib/library/queries";
import { updateBookAction } from "@/lib/library/actions";
import { BookForm } from "@/components/library/book-form";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function KitapDuzenlePage({ params }: Props) {
  const { id } = await params;
  const { profile } = await requireAuth();

  if (!canManageBooks(profile)) {
    return <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Bu işlem için yetkiniz bulunmamaktadır.</div>;
  }

  const [book, categories] = await Promise.all([
    getBookById(id),
    getActiveCategories(),
  ]);

  if (!book) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Kütüphane" title="Kitap Düzenle" description={`${book.title} kitabını düzenleyin.`} />
      <BookForm action={updateBookAction} title="Kitap Bilgileri" description="Kitap detaylarını güncelleyin." book={book} categories={categories} />
    </div>
  );
}
