"use client"

import { useState } from "react"

type TeacherLogSummary = {
  teacher_id: string
  teacher_name: string
  total_logs: number
  dates: string[]
  logs: Array<{
    id: string
    lesson_date: string
    class_name: string
    course_name: string
    topics: string
  }>
}

type MissingTeacher = {
  id: string
  full_name: string
}

export function WeeklySummaryReport({
  teacherSummaries,
  missingTeachers,
  weekStart,
  weekEnd,
}: {
  teacherSummaries: TeacherLogSummary[]
  missingTeachers: MissingTeacher[]
  weekStart: string
  weekEnd: string
}) {
  const [expandedTeacher, setExpandedTeacher] = useState<string | null>(null)

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    return `${startDate.toLocaleDateString("tr-TR", { day: "numeric", month: "long" })} - ${endDate.toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Haftalık Özet Raporu</h3>
        <span className="text-sm text-muted-foreground">
          {formatDateRange(weekStart, weekEnd)}
        </span>
      </div>

      {missingTeachers.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h4 className="font-medium text-amber-800">Eksik Not Giren Öğretmenler</h4>
          <ul className="mt-2 space-y-1 text-sm text-amber-700">
            {missingTeachers.map((teacher) => (
              <li key={teacher.id}>{teacher.full_name}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-4">
        {teacherSummaries.map((summary) => (
          <div key={summary.teacher_id} className="rounded-lg border">
            <button
              onClick={() => setExpandedTeacher(
                expandedTeacher === summary.teacher_id ? null : summary.teacher_id
              )}
              className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50"
            >
              <div>
                <span className="font-medium">{summary.teacher_name}</span>
                <span className="ml-2 text-sm text-muted-foreground">
                  ({summary.total_logs} not)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {summary.dates.length} farklı gün
                </span>
                <span>{expandedTeacher === summary.teacher_id ? "▲" : "▼"}</span>
              </div>
            </button>

            {expandedTeacher === summary.teacher_id && (
              <div className="border-t p-4">
                <div className="space-y-3">
                  {summary.logs.map((log) => (
                    <div key={log.id} className="rounded border-l-2 border-primary pl-3">
                      <div className="text-sm font-medium">
                        {log.class_name} - {log.course_name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(log.lesson_date).toLocaleDateString("tr-TR", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                        })}
                      </div>
                      <p className="mt-1 text-sm">{log.topics}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {teacherSummaries.length === 0 && missingTeachers.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          Bu hafta için henüz veri yok.
        </div>
      )}
    </div>
  )
}