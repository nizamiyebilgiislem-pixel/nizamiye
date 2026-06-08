"use client";

import { useMemo, useState } from "react";

import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { PhotoUploadField } from "@/components/forms/photo-upload-field";
import { parentRelationLabels, type ParentRelation } from "@/lib/parents/constants";
import type { ParentVisibleStudent } from "@/lib/parents/queries";
import type { ProfileRow } from "@/types/database";

type ParentFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  mode: "create" | "edit";
  students: ParentVisibleStudent[];
  initialValues?: ProfileRow;
  initialStudentIds?: string[];
  initialRelation?: ParentRelation;
};

export function ParentForm({
  action,
  mode,
  students,
  initialValues,
  initialStudentIds = [],
  initialRelation = "Baba",
}: ParentFormProps) {
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>(initialStudentIds);
  const [createAuth, setCreateAuth] = useState(mode === "create");
  const selectedCount = selectedStudentIds.length;
  const sortedStudents = useMemo(
    () => [...students].sort((left, right) => left.full_name.localeCompare(right.full_name, "tr")),
    [students],
  );

  return (
    <form action={action} className="space-y-5">
      {initialValues ? <input type="hidden" name="id" value={initialValues.id} /> : null}
      {mode === "edit" && initialValues?.auth_user_id ? (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          Bu ekrandaki e-posta değişikliği Supabase Auth giriş e-postasını otomatik güncellemez.
        </div>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Ad Soyad" name="full_name" value={initialValues?.full_name} required />
        <Field label="E-posta" name="email" type="email" value={initialValues?.email} />
        <Field label="Telefon" name="phone" value={initialValues?.phone} />
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
        <div className="md:col-span-2">
          <PhotoUploadField
            label="Profil Fotoğrafı"
            name="photo"
            displayName={initialValues?.full_name}
            initialPhotoUrl={initialValues?.photo_url}
          />
        </div>
      </div>

      {mode === "create" ? (
        <div className="space-y-4 rounded-md border border-border bg-background p-4">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_200px]">
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                name="create_auth"
                checked={createAuth}
                onChange={(event) => setCreateAuth(event.target.checked)}
                className="mt-1 size-4 rounded border border-input"
              />
              <span className="space-y-1">
                <span className="block font-medium">Auth hesabı oluşturulsun</span>
                <span className="block text-muted-foreground">
                  Server-side admin client ile Supabase Auth hesabı açılır ve veli profiline bağlanır.
                </span>
              </span>
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Yakınlık Derecesi
              <select
                name="relation"
                defaultValue={initialRelation}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-ring"
              >
                {Object.entries(parentRelationLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {createAuth ? (
            <label className="grid gap-2 text-sm font-medium md:max-w-sm">
              Geçici Şifre
              <input
                name="temporary_password"
                type="password"
                minLength={8}
                required={createAuth}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-ring"
              />
            </label>
          ) : (
            <input type="hidden" name="temporary_password" value="" />
          )}
        </div>
      ) : null}

      {mode === "create" ? (
        <div className="space-y-3 rounded-md border border-border bg-background p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Talebe Seçimi</p>
              <p className="text-sm text-muted-foreground">En az bir talebe seçilmesi önerilir; bu implementasyonda zorunlu tutulur.</p>
            </div>
            <span className="text-sm text-muted-foreground">{selectedCount} talebe seçili</span>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {sortedStudents.map((student) => (
              <label key={student.id} className="flex items-start gap-3 rounded-md border border-border bg-card p-3 text-sm">
                <input
                  type="checkbox"
                  name="student_ids"
                  value={student.id}
                  defaultChecked={initialStudentIds.includes(student.id)}
                  onChange={(event) => {
                    setSelectedStudentIds((current) =>
                      event.target.checked ? [...current, student.id] : current.filter((studentId) => studentId !== student.id),
                    );
                  }}
                  className="mt-1 size-4 rounded border border-input"
                />
                <span className="space-y-1">
                  <span className="block font-medium">{student.full_name}</span>
                  <span className="block text-muted-foreground">
                    {student.department?.name ?? "Bölüm yok"} · {student.course_class?.name ?? "Sınıf yok"}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex justify-end">
        <FormSubmitButton pendingLabel="Kaydediliyor...">{mode === "create" ? "Veliyi Kaydet" : "Değişiklikleri Kaydet"}</FormSubmitButton>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  value,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  value?: string | null;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={value ?? ""}
        className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-ring"
      />
    </label>
  );
}
