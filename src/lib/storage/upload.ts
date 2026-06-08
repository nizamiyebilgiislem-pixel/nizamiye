import { randomUUID } from "crypto";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxImageSizeBytes = 3 * 1024 * 1024;

type UploadResult = {
  path: string;
  publicUrl: string;
};

export function validateImageFile(file: File | null | undefined) {
  if (!file || file.size === 0) {
    return null;
  }

  if (!allowedImageTypes.has(file.type)) {
    throw new Error("Fotoğraf yalnızca JPEG, PNG veya WebP formatında olabilir.");
  }

  if (file.size > maxImageSizeBytes) {
    throw new Error("Fotoğraf boyutu en fazla 3 MB olabilir.");
  }

  return file;
}

export async function uploadStudentPhoto(studentId: string, file: File) {
  return uploadPhoto("student-photos", studentId, file);
}

export async function uploadProfilePhoto(profileId: string, file: File) {
  return uploadPhoto("profile-photos", profileId, file);
}

async function uploadPhoto(bucket: string, recordId: string, file: File): Promise<UploadResult> {
  validateImageFile(file);

  const supabase = await createSupabaseServerClient();
  const safeName = sanitizeFilename(file.name);
  const path = `${recordId}/${Date.now()}-${randomUUID()}-${safeName}`;
  const bytes = await file.arrayBuffer();

  const { error } = await supabase.storage.from(bucket).upload(path, Buffer.from(bytes), {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    console.error("[storage:uploadPhoto]", {
      bucket,
      path,
      error: {
        name: error.name,
        message: error.message,
        status: "status" in error ? error.status : undefined,
        statusCode: "statusCode" in error ? error.statusCode : undefined,
      },
    });
    throw new Error("Fotoğraf yüklenemedi.");
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);

  return {
    path,
    publicUrl: data.publicUrl,
  };
}

function sanitizeFilename(filename: string) {
  const base = filename.trim().replace(/\s+/g, "-");
  return base
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "photo";
}
