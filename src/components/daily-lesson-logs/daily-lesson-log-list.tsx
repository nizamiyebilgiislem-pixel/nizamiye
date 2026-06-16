"use client"

import { useState } from "react"
import { deleteDailyLessonLogAction } from "@/lib/daily-lesson-logs/actions"
import type { DailyLessonLogWithRelations } from "@/lib/daily-lesson-logs/queries"

export function DailyLessonLogList({
  logs,
  canEdit,
  showActions = true,
}: {
  logs: DailyLessonLogWithRelations[]
  canEdit?: (log: DailyLessonLogWithRelations) => boolean
  showActions?: boolean
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  if (logs.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        Henüz ders notu girilmemiş.
      </div>
    )
  }

  async function handleDelete(logId: string) {
    if (!confirm("Bu ders notunu silmek istediğinizden emin misiniz?")) {
      return
    }
    setDeletingId(logId)
    try {
      await deleteDailyLessonLogAction(logId)
    } catch (error) {
      alert(error instanceof Error ? error.message : "Silme hatası")
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-4">
      {logs.map((log) => (
        <div
          key={log.id}
          className="rounded-lg border p-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  {log.class_course?.class?.name}
                </span>
                <span>-</span>
                <span>{log.class_course?.course?.name}</span>
                <span className="mx-2">|</span>
                <span>{new Date(log.lesson_date).toLocaleDateString("tr-TR")}</span>
              </div>

              {log.course_book && (
                <div className="mt-1 text-sm text-muted-foreground">
                  📖 {log.course_book.title}
                  {log.started_page && log.ended_page && (
                    <span> (sayfa {log.started_page}-{log.ended_page})</span>
                  )}
                </div>
              )}

              <div className="mt-2">
                <p className="whitespace-pre-wrap text-sm">{log.topics_covered}</p>
              </div>

              {log.notes && (
                <div className="mt-2 rounded bg-muted p-2 text-sm text-muted-foreground">
                  {log.notes}
                </div>
              )}

              <div className="mt-2 text-xs text-muted-foreground">
                {log.teacher?.full_name} tarafından •{" "}
                {new Date(log.created_at).toLocaleString("tr-TR")}
              </div>
            </div>

            {showActions && canEdit?.(log) && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleDelete(log.id)}
                  disabled={deletingId === log.id}
                  className="rounded px-3 py-1 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  {deletingId === log.id ? "Siliniyor..." : "Sil"}
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}