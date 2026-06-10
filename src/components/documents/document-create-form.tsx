"use client";

import { useState, useMemo } from "react";

import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { documentTypes } from "@/lib/documents/constants";
import type { DocumentCreateOptions } from "@/lib/documents/queries";

export function DocumentCreateForm({
  options,
  action,
}: {
  options: DocumentCreateOptions;
  action: (formData: FormData) => void | Promise<void>;
}) {
  const [departmentId, setDepartmentId] = useState("");
  const [classId, setClassId] = useState("");

  const { departments, classesByDepartment, studentsByClass } = options;

  const classes = useMemo(() => {
    if (!departmentId) return [];
    return classesByDepartment[departmentId] ?? [];
  }, [departmentId, classesByDepartment]);

  const students = useMemo(() => {
    if (!classId) return [];
    return studentsByClass[classId] ?? [];
  }, [classId, studentsByClass]);

  function handleDepartmentChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setDepartmentId(e.target.value);
    setClassId("");
  }

  function handleClassChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setClassId(e.target.value);
  }

  return (
    <form action={action} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        <label className="grid gap-2 text-sm font-medium">
          Bölüm
          <select
            name="department"
            value={departmentId}
            onChange={handleDepartmentChange}
            required
            className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal"
          >
            <option value="">Bölüm seçin</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-medium">
          Sınıf
          <select
            name="class"
            value={classId}
            onChange={handleClassChange}
            required
            disabled={!departmentId}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal disabled:opacity-50"
          >
            <option value="">
              {!departmentId
                ? "Önce bölüm seçin"
                : classes.length === 0
                  ? "Bu bölüme ait aktif sınıf bulunamadı"
                  : "Sınıf seçin"}
            </option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-medium">
          Öğrenci
          <select
            name="student_id"
            required
            disabled={!classId || students.length === 0}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal disabled:opacity-50"
          >
            <option value="">
              {!classId
                ? "Önce sınıf seçin"
                : students.length === 0
                  ? "Bu sınıfta aktif öğrenci bulunamadı"
                  : "Öğrenci seçin"}
            </option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium">
          Evrak Türü
          <select
            name="document_type"
            required
            className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal"
          >
            {documentTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-medium md:col-span-2">
          Dosya URL
          <input
            name="file_url"
            type="url"
            required
            className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal"
          />
        </label>
      </div>

      <div className="flex justify-end">
        <FormSubmitButton pendingLabel="Kaydediliyor...">Evrakı Kaydet</FormSubmitButton>
      </div>
    </form>
  );
}
