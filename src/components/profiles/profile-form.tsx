"use client";

import { useMemo, useState } from "react";

import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { PhotoUploadField } from "@/components/forms/photo-upload-field";
import { roleLabels } from "@/lib/route-permissions";
import type { DepartmentRow, ProfileRow } from "@/types/database";
import type { UserRole } from "@/types/rbac";

type ProfileFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  departments: DepartmentRow[];
  roleOptions: UserRole[];
  mode: "create" | "edit";
  initialValues?: ProfileRow;
  assignedClassCount?: number;
  enableAuthFields?: boolean;
  currentProfile?: ProfileRow;
};

export function ProfileForm({
  action,
  departments,
  roleOptions,
  mode,
  initialValues,
  assignedClassCount = 0,
  enableAuthFields = false,
  currentProfile,
}: ProfileFormProps) {
  const [role, setRole] = useState<UserRole>(initialValues?.role ?? roleOptions[0] ?? "hoca");
  const [createAuth, setCreateAuth] = useState(mode === "create");
  const requiresDepartment = role === "hoca" || role === "bolum_muduru";
  const isDepartmentManager = currentProfile?.role === "bolum_muduru";
  const effectiveDepartmentId = isDepartmentManager && currentProfile?.department_id
    ? currentProfile.department_id
    : (initialValues?.department_id ?? "");
  const showInactiveWarning = assignedClassCount > 0;
  const roleSelectOptions = useMemo(() => {
    if (initialValues && !roleOptions.includes(initialValues.role)) {
      return [initialValues.role, ...roleOptions];
    }

    return roleOptions;
  }, [initialValues, roleOptions]);

  return (
    <form action={action} className="space-y-5">
      {initialValues ? <input type="hidden" name="id" value={initialValues.id} /> : null}
      {showInactiveWarning ? (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          Bu hoca bazı sınıflarda sınıf hocası olarak atanmış. Pasifleştirirseniz sınıf hocası atamaları kaldırılacak.
        </div>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Ad Soyad" name="full_name" value={initialValues?.full_name} required />
        <Field label="E-posta" name="email" type="email" value={initialValues?.email} />
        <Field label="Telefon" name="phone" value={initialValues?.phone} />
        <div className="md:col-span-2">
          <PhotoUploadField
            label="Profil Fotoğrafı"
            name="photo"
            displayName={initialValues?.full_name}
            initialPhotoUrl={initialValues?.photo_url}
          />
        </div>
        <label className="grid gap-2 text-sm font-medium">
          Rol
          <select
            name="role"
            value={role}
            onChange={(event) => setRole(event.target.value as UserRole)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-ring"
          >
            {roleSelectOptions.map((roleOption) => (
              <option key={roleOption} value={roleOption}>
                {roleLabels[roleOption]}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Bölüm
          {isDepartmentManager ? (
            <>
              <input type="hidden" name="department_id" value={effectiveDepartmentId} />
              <div className="flex h-10 items-center rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground">
                {departments.find((d) => d.id === effectiveDepartmentId)?.name ?? "Kendi bölümünüz"}
              </div>
            </>
          ) : (
            <select
              name="department_id"
              required={requiresDepartment}
              defaultValue={initialValues?.department_id ?? ""}
              disabled={!requiresDepartment}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-ring disabled:opacity-60"
            >
              <option value="">Bölüm yok</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          )}
          {!requiresDepartment && !isDepartmentManager ? <input type="hidden" name="department_id" value="" /> : null}
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
      {mode === "edit" && initialValues?.auth_user_id ? (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          Bu profilde e-posta alanını güncellemek Supabase Auth giriş e-postasını bu fazda otomatik değiştirmez.
        </div>
      ) : null}
      {mode === "create" ? (
        <div className="space-y-4 rounded-md border border-border bg-background p-4">
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
                İşaretliyse Supabase Auth üzerinde giriş hesabı açılır ve `profiles.auth_user_id` alanına bağlanır.
              </span>
            </span>
          </label>
          {createAuth ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Geçici Şifre" name="temporary_password" type="password" required />
              <div className="rounded-md border border-border bg-card p-3 text-sm text-muted-foreground">
                Supabase Auth hesabı `email_confirm = true` ile server tarafında oluşturulur.
              </div>
            </div>
          ) : (
            <input type="hidden" name="temporary_password" value="" />
          )}
        </div>
      ) : null}
      <div className="flex justify-end">
        <FormSubmitButton pendingLabel="Kaydediliyor...">{mode === "create" ? "Profili Kaydet" : "Değişiklikleri Kaydet"}</FormSubmitButton>
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
