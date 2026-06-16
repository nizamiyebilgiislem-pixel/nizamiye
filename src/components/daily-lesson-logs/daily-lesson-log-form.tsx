"use client"

import { FormSubmitButton } from "@/components/forms/form-submit-button"
import { createDailyLessonLogAction, updateDailyLessonLogAction } from "@/lib/daily-lesson-logs/actions"
import type { DailyLessonLogWithRelations } from "@/lib/daily-lesson-logs/queries"

type ClassCourseOption = {
  id: string
  class: { id: string; name: string }
  course: { id: string; name: string }
}

type CourseBookOption = {
  id: string
  title: string
}

export function DailyLessonLogForm({
  log,
  classCourses,
  courseBooks,
}: {
  log?: DailyLessonLogWithRelations
  classCourses: ClassCourseOption[]
  courseBooks: CourseBookOption[]
}) {
  const today = new Date().toISOString().split("T")[0]

  return (
    <form
      action={log ? updateDailyLessonLogAction : createDailyLessonLogAction}
      className="space-y-4"
    >
      {log && <input type="hidden" name="id" value={log.id} />}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium">
          Ders Seçimi *
          <select
            name="class_course_id"
            required
            defaultValue={log?.class_course?.id ?? ""}
            disabled={!!log}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50"
          >
            <option value="">Ders seçin...</option>
            {classCourses.map((cc) => (
              <option key={cc.id} value={cc.id}>
                {cc.class.name} - {cc.course.name}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-medium">
          Tarih *
          <input
            name="lesson_date"
            type="date"
            required
            defaultValue={log?.lesson_date ?? today}
            disabled={!!log}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium">
          Kitap (Opsiyonel)
          <select
            name="course_book_id"
            defaultValue={log?.course_book?.id ?? ""}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Kitap seçilmedi</option>
            {courseBooks.map((book) => (
              <option key={book.id} value={book.id}>
                {book.title}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="grid gap-2 text-sm font-medium">
            Başlangıç Sayfası
            <input
              name="started_page"
              type="number"
              min="0"
              defaultValue={log?.started_page ?? ""}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium">
            Bitiş Sayfası
            <input
              name="ended_page"
              type="number"
              min="0"
              defaultValue={log?.ended_page ?? ""}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            />
          </label>
        </div>
      </div>

      <label className="grid gap-2 text-sm font-medium">
        İşlenen Konular *
        <textarea
          name="topics_covered"
          required
          rows={3}
          defaultValue={log?.topics_covered ?? ""}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Bu derste hangi konular işlendi? (örn: Soru çözümü, yeni ünite girişi...)"
        />
      </label>

      <label className="grid gap-2 text-sm font-medium">
        Notlar (Opsiyonel)
        <textarea
          name="notes"
          rows={2}
          defaultValue={log?.notes ?? ""}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Ek notlar, gözlemler..."
        />
      </label>

      <div className="flex justify-end">
        <FormSubmitButton pendingLabel="Kaydediliyor...">
          {log ? "Notu Güncelle" : "Ders Notu Ekle"}
        </FormSubmitButton>
      </div>
    </form>
  )
}