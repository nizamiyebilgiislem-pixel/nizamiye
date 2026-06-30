"use client";

import { useActionState, useState } from "react";
import Link from "next/link";

import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  SearchableComboboxRoot,
  SearchableComboboxInput,
  SearchableComboboxTrigger,
  SearchableComboboxPopup,
  SearchableComboboxEmpty,
  SearchableComboboxItem,
  type ComboboxItemData as ComboboxItemType,
} from "@/components/ui/searchable-combobox";
import { SearchIcon } from "lucide-react";

type BookOption = { id: string; title: string; author: string | null; available_count: number; shelf_code: string | null };
type StudentOption = { id: string; full_name: string };
type ProfileOption = { id: string; full_name: string; role: string };

type LoanFormProps = {
  action: (previousState: unknown, formData: FormData) => Promise<{ error?: string; success?: boolean }>;
  preselectedBookId?: string;
  books: BookOption[];
  students: StudentOption[];
  profiles: ProfileOption[];
};

function toComboboxItem(book: BookOption): ComboboxItemType {
  const author = book.author ? ` - ${book.author}` : "";
  return {
    value: book.id,
    label: `${book.title}${author}`,
    meta: `${book.available_count} mevcut`,
  };
}

function studentToItem(s: StudentOption): ComboboxItemType {
  return { value: s.id, label: s.full_name };
}

function profileToItem(p: ProfileOption): ComboboxItemType {
  return { value: p.id, label: `${p.full_name} (${p.role})` };
}

export function LoanForm({ action, preselectedBookId, books, students, profiles }: LoanFormProps) {
  const [state, formAction] = useActionState(action, undefined);
  const [borrowerType, setBorrowerType] = useState("student");
  const [selectedBook, setSelectedBook] = useState<ComboboxItemType | null>(
    preselectedBookId ? toComboboxItem(books.find((b) => b.id === preselectedBookId) ?? books[0]) : null
  );
  const [selectedBorrower, setSelectedBorrower] = useState<ComboboxItemType | null>(null);

  const availableBooks = books.filter((b) => b.available_count > 0);
  const bookItems = availableBooks.map(toComboboxItem);
  const borrowerItems = borrowerType === "student"
    ? students.map(studentToItem)
    : profiles.map(profileToItem);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Emanet Bilgileri</CardTitle>
          <CardDescription>Kitap ve alıcı bilgilerini girin.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-5">
            <input type="hidden" name="book_id" value={selectedBook?.value ?? ""} />
            <input type="hidden" name={borrowerType === "student" ? "student_id" : "profile_id"} value={selectedBorrower?.value ?? ""} />

            <label className="grid gap-2 text-sm font-medium">
              Kitap *
              <SearchableComboboxRoot
                value={selectedBook}
                onValueChange={(v) => setSelectedBook(v as ComboboxItemType | null)}
              >
                <div className="flex h-10 w-full items-center rounded-md border border-input bg-background text-sm shadow-sm transition-colors focus-within:border-[#093657] focus-within:ring-2 focus-within:ring-[#093657]/20 has-aria-invalid:border-destructive">
                  <SearchIcon className="ml-3 size-4 shrink-0 text-muted-foreground" />
                  <SearchableComboboxInput placeholder="Kitap ara..." />
                  <SearchableComboboxTrigger />
                </div>
                <SearchableComboboxPopup>
                  <SearchableComboboxEmpty>Kitap bulunamadı.</SearchableComboboxEmpty>
                  <ComboboxList items={bookItems} />
                </SearchableComboboxPopup>
              </SearchableComboboxRoot>
            </label>

            <label className="grid gap-2 text-sm font-medium">
              Alan Kişi Türü
              <NativeSelect
                name="borrower_type"
                value={borrowerType}
                onChange={(e) => { setBorrowerType(e.target.value); setSelectedBorrower(null); }}
              >
                <option value="student">Talebe</option>
                <option value="profile">Personel / Hoca</option>
              </NativeSelect>
            </label>

            <label className="grid gap-2 text-sm font-medium">
              {borrowerType === "student" ? "Talebe" : "Personel / Hoca"} *
              <SearchableComboboxRoot
                value={selectedBorrower}
                onValueChange={(v) => setSelectedBorrower(v as ComboboxItemType | null)}
              >
                <div className="flex h-10 w-full items-center rounded-md border border-input bg-background text-sm shadow-sm transition-colors focus-within:border-[#093657] focus-within:ring-2 focus-within:ring-[#093657]/20 has-aria-invalid:border-destructive">
                  <SearchIcon className="ml-3 size-4 shrink-0 text-muted-foreground" />
                  <SearchableComboboxInput
                    placeholder={borrowerType === "student" ? "Talebe ara..." : "Personel ara..."}
                  />
                  <SearchableComboboxTrigger />
                </div>
                <SearchableComboboxPopup>
                  <SearchableComboboxEmpty>
                    {borrowerType === "student" ? "Talebe bulunamadı." : "Personel bulunamadı."}
                  </SearchableComboboxEmpty>
                  <ComboboxList items={borrowerItems} />
                </SearchableComboboxPopup>
              </SearchableComboboxRoot>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium">
                Alış Tarihi *
                <Input
                  name="loan_date"
                  type="date"
                  required
                  defaultValue={new Date().toISOString().split("T")[0]}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Son Teslim Tarihi
                <Input
                  name="due_date"
                  type="date"
                />
              </label>
            </div>

            <label className="grid gap-2 text-sm font-medium">
              Not
              <Textarea
                name="note"
                placeholder="Opsiyonel not"
                rows={2}
              />
            </label>

            {state?.error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</div>
            )}

            <div className="flex items-center gap-3">
              <FormSubmitButton pendingLabel="Kaydediliyor...">Emanet Ver</FormSubmitButton>
              <Link href="/kutuphane/emanetler" className={cn(buttonVariants({ variant: "outline" }))}>İptal</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function ComboboxList({ items }: { items: ComboboxItemType[] }) {
  return (
    <>
      {items.map((item) => (
        <SearchableComboboxItem key={item.value} value={item}>
          <span className="flex flex-1 flex-col gap-0.5">
            <span>{item.label}</span>
            {item.meta && (
              <span className="text-xs text-muted-foreground">{item.meta}</span>
            )}
          </span>
        </SearchableComboboxItem>
      ))}
    </>
  );
}
