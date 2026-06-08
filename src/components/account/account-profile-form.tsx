"use client";

import { useMemo } from "react";

import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { PhotoUploadField } from "@/components/forms/photo-upload-field";
import { Textarea } from "@/components/ui/textarea";
import type { AccountProfile } from "@/lib/account/queries";
import { getProfileAge } from "@/lib/account/utils";

type AccountProfileFormProps = {
  profile: AccountProfile;
  action: (formData: FormData) => void | Promise<void>;
};

export function AccountProfileForm({ profile, action }: AccountProfileFormProps) {
  const age = useMemo(() => getProfileAge(profile.birth_date), [profile.birth_date]);
  const isStaffLike = profile.role !== "veli";

  return (
    <form action={action} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <PhotoUploadField
            label="Profil Fotoğrafı"
            name="photo"
            displayName={profile.full_name}
            initialPhotoUrl={profile.photo_url}
          />
        </div>
        <Field label="Ad Soyad" name="full_name" value={profile.full_name} required />
        <label className="grid gap-2 text-sm font-medium">
          E-posta
          <input
            value={profile.email ?? ""}
            disabled
            className="h-10 rounded-md border border-input bg-[#f3f6f9] px-3 text-sm font-normal text-muted-foreground outline-none"
          />
          <span className="text-xs text-muted-foreground">E-posta değişikliği bu ekrandan yapılamaz. Güvenlik sayfasındaki notu kullanın.</span>
        </label>
        <Field label="Telefon" name="phone" value={profile.phone} />
        <Field label="Memleket" name="hometown" value={profile.hometown} />
        {profile.role !== "veli" ? (
          <>
            <label className="grid gap-2 text-sm font-medium">
              Doğum Tarihi
              <input
                name="birth_date"
                type="date"
                defaultValue={profile.birth_date ?? ""}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-ring"
              />
            </label>
            <DisplayField label="Yaş" value={age !== null ? String(age) : "-"} />
          </>
        ) : null}
        {isStaffLike ? <Field label="Mezun Olduğu Okul" name="school_name" value={profile.school_name} /> : null}
        {isStaffLike ? <Field label="Uzmanlık Dalı" name="expertise_area" value={profile.expertise_area} /> : null}
        <label className="grid gap-2 text-sm font-medium md:col-span-2">
          Adres
          <Textarea name="address" defaultValue={profile.address ?? ""} className="min-h-24" />
        </label>
        <label className="grid gap-2 text-sm font-medium md:col-span-2">
          Biyografi / Kısa Açıklama
          <Textarea name="biography" defaultValue={profile.biography ?? ""} className="min-h-28" />
        </label>
      </div>
      <div className="flex justify-end">
        <FormSubmitButton pendingLabel="Kaydediliyor...">Profilimi Güncelle</FormSubmitButton>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  value,
  required,
}: {
  label: string;
  name: string;
  value?: string | null;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <input
        name={name}
        required={required}
        defaultValue={value ?? ""}
        className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-ring"
      />
    </label>
  );
}

function DisplayField({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-2 text-sm font-medium">
      <span>{label}</span>
      <div className="flex h-10 items-center rounded-md border border-input bg-[#f3f6f9] px-3 text-sm font-normal text-muted-foreground">
        {value}
      </div>
    </div>
  );
}
