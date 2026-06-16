"use client"

import { FormSubmitButton } from "@/components/forms/form-submit-button"
import { createStudentTaskAction, taskTypeLabels } from "@/lib/student-tasks/actions"

export function StudentTaskForm({
  students,
  onSuccess,
}: {
  students: Array<{
    id: string
    full_name: string
    photo_url: string | null
    course_class: { id: string; name: string }
  }>
  onSuccess?: () => void
}) {
  const today = new Date().toISOString().split("T")[0]

  return (
    <form action={createStudentTaskAction} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Öğrenci</label>
          <select
            name="student_id"
            required
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Öğrenci seçin</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.full_name} - {student.course_class?.name ?? "Sınıf yok"}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Görev Türü</label>
          <select name="task_type" defaultValue="duty" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            {Object.entries(taskTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium">Görev Başlığı</label>
          <input
            name="title"
            type="text"
            required
            minLength={2}
            placeholder="örn: Yarın nöbetçi"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium">Açıklama (Opsiyonel)</label>
          <textarea
            name="description"
            rows={3}
            placeholder="Görev detayları..."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Tarih (Opsiyonel)</label>
          <input
            name="due_date"
            type="date"
            min={today}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <FormSubmitButton pendingLabel="Kaydediliyor...">
          Görev Oluştur
        </FormSubmitButton>
      </div>
    </form>
  )
}