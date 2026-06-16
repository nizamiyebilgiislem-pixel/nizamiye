"use client"

import { useState } from "react"
import { Play } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { FormSubmitButton } from "@/components/forms/form-submit-button"
import { updateCourseBookProgressAction } from "@/lib/course-books/actions"
import type { ClassRow } from "@/types/database"

export function ClassProgressInitForm({
  courseBookId,
  classes,
  existingProgressClassIds,
}: {
  courseBookId: string
  classes: ClassRow[]
  existingProgressClassIds: string[]
}) {
  const [open, setOpen] = useState(false)
  const [selectedClassId, setSelectedClassId] = useState("")

  const availableClasses = classes.filter((c) => !existingProgressClassIds.includes(c.id))

  if (availableClasses.length === 0) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className={buttonVariants({ variant: "outline", size: "sm" })}>
          <Play className="size-4 mr-1" /> Sınıf Ekle
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kitap İlerlemesi Başlat</DialogTitle>
        </DialogHeader>
        <form action={updateCourseBookProgressAction} className="space-y-4">
          <input type="hidden" name="course_book_id" value={courseBookId} />
          <input type="hidden" name="status" value="not_started" />

          <label className="grid gap-2 text-sm font-medium">
            Sınıf Seç
            <select
              name="class_id"
              required
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Sınıf seçin</option>
              {availableClasses.map((classRow) => (
                <option key={classRow.id} value={classRow.id}>
                  {classRow.name}
                </option>
              ))}
            </select>
          </label>

          <div className="flex justify-end">
            <FormSubmitButton pendingLabel="Kaydediliyor...">
              Başlat
            </FormSubmitButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}