"use client";

import { useCallback, useState } from "react";

import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { createDersSistemiAction } from "@/lib/ders-sistemi/actions";
import { cn } from "@/lib/utils";
import type { ClassRow, DepartmentRow, ProfileRow } from "@/types/database";
import type { UserRole } from "@/types/rbac";

type DersSistemiFormProps = {
  departments: DepartmentRow[];
  classes: ClassRow[];
  teachers: ProfileRow[];
  profileRole: UserRole;
  profileDepartmentId: string | null;
};

export function DersSistemiForm({
  departments,
  classes,
  teachers,
  profileRole,
  profileDepartmentId,
}: DersSistemiFormProps) {
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState(
    profileRole === "bolum_muduru" ? profileDepartmentId ?? "" : departments[0]?.id ?? "",
  );

  const filteredClasses = classes.filter(
    (c) => c.department_id === selectedDepartmentId,
  );

  const filteredTeachers = teachers.filter(
    (t) => t.role === "hoca",
  );

  const toggleClass = useCallback((classId: string) => {
    setSelectedClassIds((prev) =>
      prev.includes(classId)
        ? prev.filter((id) => id !== classId)
        : [...prev, classId],
    );
  }, []);

  const isBounded = profileRole === "bolum_muduru";

  return (
    <form action={createDersSistemiAction} className="space-y-6">
      <label className="grid gap-2 text-sm font-medium">
        Ders Adı *
        <input
          name="name"
          required
          className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20"
          placeholder="Örn. Matematik"
        />
      </label>

      <label className="grid gap-2 text-sm font-medium">
        Bölüm *
        {isBounded ? (
          <>
            <input type="hidden" name="department_id" value={profileDepartmentId ?? ""} />
            <div className="h-10 rounded-md border border-input bg-muted px-3 text-sm leading-10 text-muted-foreground">
              {departments.find((d) => d.id === profileDepartmentId)?.name ?? profileDepartmentId}
            </div>
          </>
        ) : (
          <select
            name="department_id"
            value={selectedDepartmentId}
            onChange={(e) => {
              setSelectedDepartmentId(e.target.value);
              setSelectedClassIds([]);
            }}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20"
          >
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
        )}
      </label>

      <input type="hidden" name="class_ids" value={selectedClassIds.join(",")} />

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Sınıf Atamaları</legend>
        {filteredClasses.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {departments.length === 0
              ? "Bölüm bulunamadı."
              : "Bu bölüme ait sınıf bulunamadı."}
          </p>
        ) : (
          <div className="space-y-2">
            {filteredClasses.map((classRow) => {
              const checked = selectedClassIds.includes(classRow.id);
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
                            .filter((t) => !isBounded || t.department_id === profileDepartmentId || t.department_id === classRow.department_id)
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
        <FormSubmitButton pendingLabel="Oluşturuluyor...">Oluştur</FormSubmitButton>
      </div>
    </form>
  );
}
