"use client";

import { useCallback, useState } from "react";
import Link from "next/link";

import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { toggleClassCourseAction, updateDersSistemiAction } from "@/lib/ders-sistemi/actions";
import { cn } from "@/lib/utils";
import type { ClassRow, DepartmentRow, ProfileRow } from "@/types/database";
import type { UserRole } from "@/types/rbac";
import type { DersSistemiCourse } from "@/lib/ders-sistemi/queries";

type DersSistemiEditFormProps = {
  course: DersSistemiCourse;
  departments: DepartmentRow[];
  classes: ClassRow[];
  teachers: ProfileRow[];
  assignedClassIds: string[];
  profileRole: UserRole;
  profileDepartmentId: string | null;
};

export function DersSistemiEditForm({
  course,
  departments,
  classes,
  teachers,
  assignedClassIds: initialAssigned,
  profileRole,
  profileDepartmentId,
}: DersSistemiEditFormProps) {
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>(initialAssigned);
  const [activeTab, setActiveTab] = useState<"details" | "assignments">("details");

  const filteredTeachers = teachers.filter((t) => t.role === "hoca");
  const departmentClasses = classes.filter(
    (c) => c.department_id === course.department_id,
  );

  const toggleClass = useCallback((classId: string) => {
    setSelectedClassIds((prev) =>
      prev.includes(classId)
        ? prev.filter((id) => id !== classId)
        : [...prev, classId],
    );
  }, []);

  const activeAssignments = course.assignments.filter((a) => a.is_active);
  const inactiveAssignments = course.assignments.filter((a) => !a.is_active);

  return (
    <div className="space-y-6">
      <div className="flex gap-1 border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab("details")}
          className={cn(
            "px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "details"
              ? "border-b-2 border-[#093657] text-[#093657]"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Ders Detayları
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("assignments")}
          className={cn(
            "px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "assignments"
              ? "border-b-2 border-[#093657] text-[#093657]"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Sınıf Atamaları ({activeAssignments.length})
        </button>
      </div>

      {activeTab === "details" && (
        <form action={updateDersSistemiAction} className="space-y-5">
          <input type="hidden" name="course_id" value={course.id} />
          <input type="hidden" name="class_ids" value={selectedClassIds.join(",")} />

          <label className="grid gap-2 text-sm font-medium">
            Ders Adı
            <input
              name="name"
              defaultValue={course.name}
              required
              className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium">
            Bölüm
            <div className="h-10 rounded-md border border-input bg-muted px-3 text-sm leading-10 text-muted-foreground">
              {departments.find((d) => d.id === course.department_id)?.name ?? "-"}
            </div>
          </label>

          <label className="grid gap-2 text-sm font-medium">
            Durum
            <select
              name="is_active"
              defaultValue={String(course.is_active)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20"
            >
              <option value="true">Aktif</option>
              <option value="false">Pasif</option>
            </select>
          </label>

          <div className="flex items-center gap-3 pt-2">
            <FormSubmitButton pendingLabel="Kaydediliyor...">Kaydet</FormSubmitButton>
          </div>
        </form>
      )}

      {activeTab === "assignments" && (
        <div className="space-y-6">
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Mevcut Atamalar</legend>
            {activeAssignments.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Bu dersin aktif sınıf ataması bulunmuyor.
              </p>
            ) : (
              <div className="space-y-2">
                {activeAssignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between rounded-md border border-border bg-[#f8fafc] px-3 py-2"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/siniflar/${assignment.class_id}`}
                        className="text-sm font-medium text-[#093657] hover:underline"
                      >
                        {assignment.class_name}
                      </Link>
                      {assignment.teacher && (
                        <Link
                          href={`/hocalar/${assignment.teacher.id}`}
                          className="ml-3 text-xs text-muted-foreground hover:underline"
                        >
                          {assignment.teacher.full_name}
                        </Link>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <form action={toggleClassCourseAction}>
                        <input type="hidden" name="class_course_id" value={assignment.id} />
                        <input type="hidden" name="action" value="deactivate" />
                        <button type="submit" className="text-xs text-amber-600 hover:underline">
                          Pasifleştir
                        </button>
                      </form>
                      <form action={toggleClassCourseAction}>
                        <input type="hidden" name="class_course_id" value={assignment.id} />
                        <input type="hidden" name="action" value="delete" />
                        <button type="submit" className="text-xs text-red-600 hover:underline">
                          Kaldır
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </fieldset>

          {inactiveAssignments.length > 0 && (
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Pasif Atamalar</legend>
              <div className="space-y-2">
                {inactiveAssignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between rounded-md border border-border bg-muted/50 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <span className="text-sm text-muted-foreground">
                        {assignment.class_name}
                      </span>
                    </div>
                    <form action={toggleClassCourseAction}>
                      <input type="hidden" name="class_course_id" value={assignment.id} />
                      <input type="hidden" name="action" value="activate" />
                      <button type="submit" className="text-xs text-[#093657] hover:underline">
                        Aktifleştir
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            </fieldset>
          )}

          <form action={updateDersSistemiAction} className="space-y-4">
            <input type="hidden" name="course_id" value={course.id} />
            <input type="hidden" name="class_ids" value={selectedClassIds.join(",")} />

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Yeni Sınıf Ekle</legend>
              {departmentClasses.filter(
                (c) => !course.assignments.some((a) => a.class_id === c.id),
              ).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Eklenebilecek sınıf kalmadı.
                </p>
              ) : (
                <div className="space-y-2">
                  {departmentClasses.map((classRow) => {
                    const checked = selectedClassIds.includes(classRow.id);
                    const isAlreadyAssigned = course.assignments.some(
                      (a) => a.class_id === classRow.id,
                    );
                    if (isAlreadyAssigned) return null;
                    return (
                      <div
                        key={classRow.id}
                        className={cn(
                          "rounded-md border border-border px-3 py-2 transition-colors",
                          checked && "border-[#093657] bg-[#093657]/5",
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id={`class-${classRow.id}`}
                            checked={checked}
                            onChange={() => toggleClass(classRow.id)}
                            className="size-4 rounded border-input accent-[#093657]"
                          />
                          <label
                            htmlFor={`class-${classRow.id}`}
                            className="flex-1 cursor-pointer text-sm font-medium"
                          >
                            {classRow.name}
                          </label>
                          {checked && (
                            <div className="w-56">
                              <select
                                name={`teacher_${classRow.id}`}
                                defaultValue=""
                                className={cn(
                                  "h-8 w-full rounded-md border border-input bg-background px-2 text-xs",
                                  "focus:outline-none focus:ring-2 focus:ring-[#093657]/20",
                                )}
                              >
                                <option value="">Hoca seç (opsiyonel)</option>
                                {filteredTeachers
                                  .filter(
                                    (t) =>
                                      profileRole !== "bolum_muduru" ||
                                      t.department_id === profileDepartmentId ||
                                      t.department_id === classRow.department_id,
                                  )
                                  .map((teacher) => (
                                    <option key={teacher.id} value={teacher.id}>
                                      {teacher.full_name}
                                    </option>
                                  ))}
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </fieldset>

            <div className="flex items-center gap-3 pt-2">
              <FormSubmitButton pendingLabel="Kaydediliyor...">
                Atamaları Kaydet
              </FormSubmitButton>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
