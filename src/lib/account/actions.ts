"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { buildAuditActor, createAuditLog } from "@/lib/audit/log";
import { requireAuth } from "@/lib/auth";
import { uploadProfilePhoto, validateImageFile } from "@/lib/storage/upload";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const emptyToNull = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}, z.string().nullable());

const accountProfileSchema = z.object({
  full_name: z.string().trim().min(2, "Ad soyad zorunludur."),
  phone: emptyToNull,
  hometown: emptyToNull,
  birth_date: emptyToNull,
  address: emptyToNull,
  biography: emptyToNull,
  school_name: emptyToNull,
  expertise_area: emptyToNull,
});

const passwordSchema = z
  .object({
    password: z.string().trim().min(8, "Şifre en az 8 karakter olmalıdır."),
    password_confirm: z.string().trim().min(8, "Şifre tekrarı en az 8 karakter olmalıdır."),
  })
  .superRefine((data, context) => {
    if (data.password !== data.password_confirm) {
      context.addIssue({
        code: "custom",
        message: "Şifreler eşleşmiyor.",
        path: ["password_confirm"],
      });
    }
  });

export async function updateOwnProfileAction(formData: FormData) {
  const { profile } = await requireAuth();
  const parsed = accountProfileSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirect(`/hesabim/profil?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Form bilgileri hatalı.")}`);
  }

  const photoFile = getPhotoFile(formData);

  if (photoFile) {
    validateAccountPhoto(photoFile);
  }

  const supabase = await createSupabaseServerClient();
  const updatePayload = {
    full_name: parsed.data.full_name,
    phone: parsed.data.phone,
    hometown: parsed.data.hometown,
    birth_date: parsed.data.birth_date,
    address: parsed.data.address,
    biography: parsed.data.biography,
    school_name: isStaffLikeRole(profile.role) ? parsed.data.school_name : null,
    expertise_area: isStaffLikeRole(profile.role) ? parsed.data.expertise_area : null,
  };

  const { error } = await supabase.from("profiles").update(updatePayload).eq("id", profile.id);

  if (error) {
    redirect("/hesabim/profil?error=save");
  }

  if (photoFile) {
    const uploaded = await uploadProfilePhoto(profile.id, photoFile).catch(() => {
      redirect("/hesabim/profil?error=photo-upload");
    });

    if (uploaded) {
      await supabase.from("profiles").update({ photo_url: uploaded.publicUrl }).eq("id", profile.id);
    }
  }

  createAuditLog({
    ...buildAuditActor(profile),
    action: "profile_updated",
    entityType: "profile",
    entityId: profile.id,
    title: "Profil güncellendi",
    description: "Profil bilgileri güncellendi.",
  });

  revalidatePath("/hesabim");
  revalidatePath("/hesabim/profil");
  revalidatePath("/hesabim/guvenlik");
  redirect("/hesabim/profil?success=profile-updated");
}

export async function updateOwnPasswordAction(formData: FormData) {
  const { profile } = await requireAuth();
  const parsed = passwordSchema.safeParse({
    password: formData.get("password"),
    password_confirm: formData.get("password_confirm"),
  });

  if (!parsed.success) {
    redirect(`/hesabim/guvenlik?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Form bilgileri hatalı.")}`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    redirect("/hesabim/guvenlik?error=password-update");
  }

  createAuditLog({
    ...buildAuditActor(profile),
    action: "password_changed",
    entityType: "profile",
    entityId: profile.id,
    title: "Şifre değiştirildi",
    description: "Hesap şifresi değiştirildi.",
  });

  revalidatePath("/hesabim/guvenlik");
  redirect("/hesabim/guvenlik?success=password-updated");
}

function getPhotoFile(formData: FormData) {
  const value = formData.get("photo");
  return value instanceof File && value.size > 0 ? value : null;
}

function validateAccountPhoto(file: File) {
  try {
    validateImageFile(file);
  } catch {
    redirect("/hesabim/profil?error=photo");
  }
}

function isStaffLikeRole(role: string) {
  return role === "hoca" || role === "bolum_muduru" || role === "genel_mudur" || role === "admin";
}
