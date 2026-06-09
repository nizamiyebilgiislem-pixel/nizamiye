"use client";

import { useMemo, useState } from "react";

import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { PhotoUploadField } from "@/components/forms/photo-upload-field";
import { createStudentAction } from "@/lib/students/actions";
import type { ClassRow, DepartmentRow, ProfileRow } from "@/types/database";

type StudentCreateFormProps = {
  departments: DepartmentRow[];
  classes: ClassRow[];
  profile: ProfileRow;
};

export function StudentCreateForm({ departments, classes, profile }: StudentCreateFormProps) {
  const visibleDepartments =
    profile.role === "bolum_muduru" ? departments.filter((department) => department.id === profile.department_id) : departments;

  const [departmentId, setDepartmentId] = useState("");

  const filteredClasses = useMemo(
    () => classes.filter((courseClass) => courseClass.department_id === departmentId && courseClass.is_active),
    [classes, departmentId],
  );

  function handleDepartmentChange(event: React.ChangeEvent<HTMLSelectElement>) {
    setDepartmentId(event.target.value);
  }

  return (
    <form action={createStudentAction} className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Talebe Adı Soyadı" name="full_name" required />
        <Field label="TC Kimlik" name="identity_number" />
        <label className="grid gap-2 text-sm font-medium">
          Bölüm
          <select
            name="department_id"
            required
            value={departmentId}
            onChange={handleDepartmentChange}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-ring"
          >
            <option value="">Bölüm seçin</option>
            {visibleDepartments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Kurs Sınıfı
          <select
            name="course_class_id"
            required
            disabled={!departmentId}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-ring disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="">
              {!departmentId
                ? "Önce bölüm seçin"
                : filteredClasses.length === 0
                  ? "Bu bölüme ait aktif sınıf bulunamadı."
                  : "Kurs sınıfı seçin"}
            </option>
            {filteredClasses.map((courseClass) => (
              <option key={courseClass.id} value={courseClass.id}>
                {courseClass.name}
              </option>
            ))}
          </select>
        </label>
        <Field label="Veli Telefonu" name="guardian_phone" />
        <Field label="Okul Sınıfı" name="school_class" />
        <Field label="Okulu" name="school_name" />
        <div className="md:col-span-2">
          <PhotoUploadField label="Talebe Fotoğrafı" name="photo" />
        </div>
      </div>
      <div className="flex justify-end">
        <FormSubmitButton pendingLabel="Kaydediliyor...">Talebeyi Kaydet</FormSubmitButton>
      </div>
    </form>
  );
}

function Field({ label, name, required }: { label: string; name: string; required?: boolean }) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <input
        name={name}
        required={required}
        className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-ring"
      />
    </label>
  );
}
