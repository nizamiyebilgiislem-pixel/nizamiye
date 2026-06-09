"use client";

import { useActionState } from "react";
import Link from "next/link";

import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BookWithCategory } from "@/lib/library/queries";

type CategoryOption = { id: string; name: string };

type BookFormProps = {
  action: (previousState: unknown, formData: FormData) => Promise<{ error?: string; success?: boolean }>;
  title: string;
  description: string;
  book?: BookWithCategory;
  categories: CategoryOption[];
};

export function BookForm({ action, title, description, book, categories }: BookFormProps) {
  const [state, formAction] = useActionState(action, undefined);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-5">
            {book ? <input type="hidden" name="id" value={book.id} /> : null}

            <label className="grid gap-2 text-sm font-medium">
              Kategori
              <select
                name="category_id"
                defaultValue={book?.category_id ?? ""}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-ring"
              >
                <option value="">Kategori seçin</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-medium">
              Kitap Adı *
              <input
                name="title"
                defaultValue={book?.title ?? ""}
                required
                placeholder="Kitap adı"
                className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-ring"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium">
                Yazar
                <input
                  name="author"
                  defaultValue={book?.author ?? ""}
                  placeholder="Yazar adı"
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-ring"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Yayın Evi
                <input
                  name="publisher"
                  defaultValue={book?.publisher ?? ""}
                  placeholder="Yayın evi"
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-ring"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium">
                ISBN
                <input
                  name="isbn"
                  defaultValue={book?.isbn ?? ""}
                  placeholder="ISBN numarası"
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-ring"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Yayın Yılı
                <input
                  name="publication_year"
                  type="number"
                  defaultValue={book?.publication_year ?? ""}
                  placeholder="Örn: 2024"
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-ring"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium">
                Raf Kodu
                <input
                  name="shelf_code"
                  defaultValue={book?.shelf_code ?? ""}
                  placeholder="Örn: A-01"
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-ring"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Konum Notu
                <input
                  name="location_note"
                  defaultValue={book?.location_note ?? ""}
                  placeholder="Ek konum bilgisi"
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-ring"
                />
              </label>
            </div>

            <label className="grid gap-2 text-sm font-medium">
              Toplam Nüsha *
              <input
                name="total_count"
                type="number"
                min="1"
                defaultValue={book?.total_count ?? 1}
                required
                className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-ring"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium">
              Açıklama
              <textarea
                name="description"
                defaultValue={book?.description ?? ""}
                placeholder="Opsiyonel açıklama"
                rows={3}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm font-normal outline-none focus:border-ring"
              />
            </label>

            {book ? (
              <label className="grid gap-2 text-sm font-medium">
                Durum
                <select
                  name="is_active"
                  defaultValue={String(book.is_active)}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-ring"
                >
                  <option value="true">Aktif</option>
                  <option value="false">Pasif</option>
                </select>
              </label>
            ) : (
              <input type="hidden" name="is_active" value="true" />
            )}

            {state?.error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</div>
            )}

            <div className="flex items-center gap-3">
              <FormSubmitButton pendingLabel="Kaydediliyor...">
                {book ? "Değişiklikleri Kaydet" : "Kitabı Kaydet"}
              </FormSubmitButton>
              <Link href={book ? `/kutuphane/kitaplar/${book.id}` : "/kutuphane/kitaplar"} className={cn(buttonVariants({ variant: "outline" }))}>
                İptal
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
