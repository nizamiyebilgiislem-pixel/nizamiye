"use client"

import { FormSubmitButton } from "@/components/forms/form-submit-button"
import { createCourseBookAction, updateCourseBookAction } from "@/lib/course-books/actions"
import type { CourseBookRow } from "@/types/database"

export function CourseBookForm({
  courseId,
  book,
  onSuccess,
}: {
  courseId: string
  book?: CourseBookRow
  onSuccess?: () => void
}) {
  return (
    <form
      action={book ? updateCourseBookAction : createCourseBookAction}
      className="space-y-4"
    >
      {book && <input type="hidden" name="id" value={book.id} />}
      <input type="hidden" name="course_id" value={courseId} />

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium">
          Kitap Adı *
          <input
            name="title"
            required
            defaultValue={book?.title ?? ""}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            placeholder="örn: Avamil 1"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium">
          Yazar (Opsiyonel)
          <input
            name="author"
            defaultValue={book?.author ?? ""}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            placeholder="örn: İbrahim Hilmi"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium">
          Sıra
          <input
            name="book_order"
            type="number"
            min="0"
            defaultValue={book?.book_order ?? 0}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          />
        </label>

        {book && (
          <label className="grid gap-2 text-sm font-medium">
            Durum
            <select
              name="is_active"
              defaultValue={String(book.is_active)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="true">Aktif</option>
              <option value="false">Pasif</option>
            </select>
          </label>
        )}
      </div>

      <div className="flex justify-end">
        <FormSubmitButton pendingLabel="Kaydediliyor...">
          {book ? "Kitabı Güncelle" : "Kitap Ekle"}
        </FormSubmitButton>
      </div>
    </form>
  )
}