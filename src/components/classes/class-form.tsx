"use client";

import { useMemo, useState } from "react";

import type { DepartmentRow, ProfileRow } from "@/types/database";

type ClassFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  departments: DepartmentRow[];
  teachers: ProfileRow[];
  profile: ProfileRow;
  mode: "create" | "edit";
  initialValues?: {
    id?: string;
    department_id: string;
    name: string;
    class_teacher_id: string | null;
    is_active: boolean;
  };
};

export function ClassForm({ action, departments, teachers, profile, mode, initialValues }: ClassFormProps) {
  const fixedDepartmentId = profile.role === "bolum_muduru" ? profile.department_id ?? "" : undefined;
  const initialDepartmentId = fixedDepartmentId ?? initialValues?.department_id ?? departments[0]?.id ?? "";
  const [departmentId, setDepartmentId] = useState(initialDepartmentId);
  const filteredTeachers = useMemo(
    () => teachers.filter((teacher) => teacher.department_id === departmentId),
    [departmentId, teachers],
  );

  return (
    <form action={action} className="space-y-5">
      {initialValues?.id ? <input type="hidden" name="id" value={initialValues.id} /> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium">
          Bölüm
          <select
            name="department_id"
            value={departmentId}
            disabled={mode === "edit" || Boolean(fixedDepartmentId)}
            onChange={(event) => setDepartmentId(event.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-ring disabled:opacity-60"
          >
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
          {(mode === "edit" || fixedDepartmentId) && <input type="hidden" name="department_id" value={departmentId} />}
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Sınıf Adı
          <input
            name="name"
            required
            defaultValue={initialValues?.name ?? ""}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-ring"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Sınıf Hocası
          <select
            name="class_teacher_id"
            defaultValue={initialValues?.class_teacher_id ?? ""}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-ring"
          >
            <option value="">Atanmadı</option>
            {filteredTeachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.full_name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Durum
          <select
            name="is_active"
            defaultValue={String(initialValues?.is_active ?? true)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-ring"
          >
            <option value="true">Aktif</option>
            <option value="false">Pasif</option>
          </select>
        </label>
      </div>
      <div className="flex justify-end">
        <button type="submit" className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
          {mode === "create" ? "Sınıfı Kaydet" : "Değişiklikleri Kaydet"}
        </button>
      </div>
    </form>
  );
}
