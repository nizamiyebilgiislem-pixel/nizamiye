"use client"

import { useState } from "react"
import { Plus, Edit, Trash2, Play, CheckCircle2, BookOpen } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { CourseBookForm } from "@/components/course-books/course-book-form"
import { ClassProgressInitForm } from "@/components/course-books/class-progress-init-form"
import { cn } from "@/lib/utils"
import type { CourseBookWithProgress } from "@/lib/course-books/queries"
import {
  deleteCourseBookAction,
  startCourseBookAction,
  completeCourseBookAction,
} from "@/lib/course-books/actions"
import type { ClassRow } from "@/types/database"

const statusLabels = {
  not_started: "Başlanmadı",
  ongoing: "Devam Ediyor",
  completed: "Tamamlandı",
}

const statusColors = {
  not_started: "bg-gray-100 text-gray-600",
  ongoing: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
}

function StartButton({ courseBookId, classId }: { courseBookId: string; classId: string }) {
  return (
    <form action={() => startCourseBookAction(courseBookId, classId)}>
      <button type="submit" className={buttonVariants({ variant: "outline", size: "xs" })}>
        <Play className="size-3 mr-1" /> Başlat
      </button>
    </form>
  )
}

function CompleteButton({ courseBookId, classId }: { courseBookId: string; classId: string }) {
  return (
    <form action={() => completeCourseBookAction(courseBookId, classId)}>
      <button type="submit" className={buttonVariants({ variant: "outline", size: "xs" })}>
        <CheckCircle2 className="size-3 mr-1" /> Bitir
      </button>
    </form>
  )
}

function DeleteButton({ courseBookId }: { courseBookId: string }) {
  return (
    <form action={() => deleteCourseBookAction(courseBookId)}>
      <button type="submit" className={buttonVariants({ variant: "ghost", size: "sm" })}>
        <Trash2 className="size-4 mr-1 text-red-500" /> Sil
      </button>
    </form>
  )
}

export function CourseBookList({
  books,
  courseId,
  classes,
}: {
  books: CourseBookWithProgress[]
  courseId: string
  classes: ClassRow[]
}) {
  const [editingBook, setEditingBook] = useState<CourseBookWithProgress | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Ders Kitapları</h3>
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogTrigger asChild>
            <button className={buttonVariants({ size: "sm" })}>
              <Plus className="mr-1.5 size-4" /> Yeni Kitap
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni Kitap Ekle</DialogTitle>
            </DialogHeader>
            <CourseBookForm courseId={courseId} onSuccess={() => setShowAddForm(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {books.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Bu derse henüz kitap eklenmemiş.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {books.map((book, index) => {
            const existingClassIds = book.progress.map((p) => p.class_id)
            return (
              <Card key={book.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#093657]/10 text-sm font-medium text-[#093657]">
                        {index + 1}
                      </span>
                      <div>
                        <CardTitle className="text-base">{book.title}</CardTitle>
                        {book.author && (
                          <p className="text-sm text-muted-foreground">{book.author}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={cn(statusColors[book.progress[0]?.status ?? "not_started"])}>
                        {statusLabels[book.progress[0]?.status ?? "not_started"]}
                      </Badge>
                      {!book.is_active && (
                        <Badge variant="destructive">Pasif</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>

                {book.progress.length > 0 ? (
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {book.progress.map((p) => {
                        const classInfo = classes.find((c) => c.id === p.class_id)
                        return (
                          <div
                            key={p.id}
                            className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2"
                          >
                            <div className="flex items-center gap-2">
                              <BookOpen className="size-4 text-muted-foreground" />
                              <span className="text-sm font-medium">{classInfo?.name ?? "Sınıf"}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              {p.started_at && (
                                <span className="text-xs text-muted-foreground">
                                  Başladı: {new Date(p.started_at).toLocaleDateString("tr-TR")}
                                </span>
                              )}
                              {p.completed_at && (
                                <span className="text-xs text-muted-foreground">
                                  Bitti: {new Date(p.completed_at).toLocaleDateString("tr-TR")}
                                </span>
                              )}
                              <div className="flex gap-1">
                                {p.status === "not_started" && (
                                  <StartButton courseBookId={book.id} classId={p.class_id} />
                                )}
                                {p.status === "ongoing" && (
                                  <CompleteButton courseBookId={book.id} classId={p.class_id} />
                                )}
                                {p.status === "completed" && (
                                  <CheckCircle2 className="size-4 text-green-600" />
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                ) : (
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        Bu kitap için henüz sınıf ilerlemesi başlatılmamış.
                      </p>
                      <ClassProgressInitForm
                        courseBookId={book.id}
                        classes={classes}
                        existingProgressClassIds={existingClassIds}
                      />
                    </div>
                  </CardContent>
                )}

                <div className="flex justify-end gap-2 border-t p-3">
                  <Dialog open={editingBook?.id === book.id} onOpenChange={(open) => !open && setEditingBook(null)}>
                    <DialogTrigger asChild>
                      <button
                        className={buttonVariants({ variant: "ghost", size: "sm" })}
                        onClick={() => setEditingBook(book)}
                      >
                        <Edit className="size-4 mr-1" /> Düzenle
                      </button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Kitabı Düzenle</DialogTitle>
                      </DialogHeader>
                      <CourseBookForm courseId={courseId} book={book} onSuccess={() => setEditingBook(null)} />
                    </DialogContent>
                  </Dialog>

                  <DeleteButton courseBookId={book.id} />
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}