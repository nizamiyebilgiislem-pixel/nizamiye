"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { uploadStudentPhoto, validateImageFile } from "@/lib/storage/upload";
import { requireAuth } from "@/lib/auth";
import { buildAuditActor, createStudentAuditLog } from "@/lib/audit/log";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { canCreateStudent, canEditStudent, canReactivateArchivedStudent } from "@/lib/students/permissions";
import { getStudentById } from "@/lib/students/queries";
import { buildSaveRedirect, logSupabaseActionError, buildFriendlyDbErrorMessage } from "@/lib/supabase-action-error";
import type { ClassRow } from "@/types/database";
import type { StudentStatus } from "@/types/rbac";

const emptyToNull = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}, z.string().nullable());

const quickCreateSchema = z.object({
  full_name: z.string().trim().min(2, "Talebe adı soyadı zorunludur."),
  department_id: z.string().uuid("Bölüm seçilmelidir."),
  course_class_id: z.string().uuid("Kurs sınıfı seçilmelidir."),
  identity_number: emptyToNull,
  guardian_phone: emptyToNull,
  school_class: emptyToNull,
  school_name: emptyToNull,
});

const studentStatusSchema = z.enum(["active", "passive", "graduated", "left"]);

const updateStudentSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().trim().min(2, "Talebe adı soyadı zorunludur."),
  identity_number: emptyToNull,
  father_name: emptyToNull,
  mother_name: emptyToNull,
  guardian_phone: emptyToNull,
  guardian_phone_2: emptyToNull,
  father_job: emptyToNull,
  mother_job: emptyToNull,
  father_status: emptyToNull,
  mother_status: emptyToNull,
  family_monthly_income: emptyToNull,
  home_status: emptyToNull,
  parent_marital_status: emptyToNull,
  blood_type: emptyToNull,
  sibling_in_institution: emptyToNull,
  birth_date: emptyToNull,
  registration_date: emptyToNull,
  course_class_id: z.string().uuid("Kurs sınıfı seçilmelidir."),
  school_class: emptyToNull,
  school_name: emptyToNull,
  nationality: emptyToNull,
  hometown: emptyToNull,
  address: emptyToNull,
  status: studentStatusSchema,
});

export async function createStudentAction(formData: FormData) {
  const { profile } = await requireAuth();

  if (!canCreateStudent(profile)) {
    redirect("/talebeler?error=unauthorized");
  }

  const parsed = quickCreateSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirect(`/talebeler/yeni?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Form bilgileri hatalı.")}`);
  }

  const courseClass = await getClassForAction(parsed.data.course_class_id);

  if (!courseClass || courseClass.department_id !== parsed.data.department_id) {
    redirect("/talebeler/yeni?error=class");
  }

  if (profile.role === "bolum_muduru" && courseClass.department_id !== profile.department_id) {
    redirect("/talebeler/yeni?error=unauthorized");
  }

  const photoFile = getPhotoFile(formData);
  if (photoFile) {
    validateStudentPhoto(photoFile, "/talebeler/yeni");
  }

  const supabase = await createSupabaseServerClient();
  const payload = {
    full_name: parsed.data.full_name,
    identity_number: parsed.data.identity_number,
    guardian_phone: parsed.data.guardian_phone,
    course_class_id: parsed.data.course_class_id,
    school_class: parsed.data.school_class,
    school_name: parsed.data.school_name,
    status: "active" as const,
    created_by: profile.id,
    updated_by: profile.id,
  };

  const { data, error } = await supabase
    .from("students")
    .insert(payload)
    .select("id")
    .single();

  if (error || !data) {
    logSupabaseActionError({
      action: "createStudentAction",
      profile: { id: profile.id, role: profile.role },
      payload,
      error: error ?? null,
    });
    redirect(buildSaveRedirect("/talebeler/yeni", error));
  }

  let uploadedPhotoUrl: string | null = null;

  if (photoFile) {
    const uploaded = await uploadStudentPhoto(data.id, photoFile).catch(() => {
      redirect(`/talebeler/${data.id}/duzenle?error=photo-upload`);
    });

    if (uploaded) {
      await supabase.from("students").update({ photo_url: uploaded.publicUrl }).eq("id", data.id);
      uploadedPhotoUrl = uploaded.publicUrl;
    }
  }

  await createStudentAuditLog({
    ...buildAuditActor(profile),
    action: "student_created",
    title: "Talebe oluşturuldu",
    description: `${parsed.data.full_name} kaydı oluşturuldu.`,
    entityId: data.id,
    studentId: data.id,
    beforeData: null,
    afterData: {
      ...payload,
      photo_url: uploadedPhotoUrl,
    },
    metadata: {
      photo_uploaded: Boolean(uploadedPhotoUrl),
    },
  });

  revalidatePath("/talebeler");
  redirect(`/talebeler/${data.id}?success=created`);
}

export async function updateStudentAction(formData: FormData) {
  const { profile } = await requireAuth();
  const parsed = updateStudentSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    const fallbackId = String(formData.get("id") ?? "");
    redirect(`/talebeler/${fallbackId}/duzenle?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Form bilgileri hatalı.")}`);
  }

  const student = await getStudentById(parsed.data.id);

  if (!student) {
    redirect("/talebeler?error=not-found");
  }

  const nextClass = await getClassForAction(parsed.data.course_class_id);

  if (!nextClass) {
    redirect(`/talebeler/${parsed.data.id}/duzenle?error=class`);
  }

  if (!canEditStudent(profile, student, student.course_class)) {
    redirect(`/talebeler/${parsed.data.id}?error=unauthorized`);
  }

  if (profile.role === "bolum_muduru" && nextClass.department_id !== profile.department_id) {
    redirect(`/talebeler/${parsed.data.id}/duzenle?error=unauthorized`);
  }

  const photoFile = getPhotoFile(formData);
  if (photoFile) {
    validateStudentPhoto(photoFile, `/talebeler/${parsed.data.id}/duzenle`);
  }

  const nextStatus = getAllowedNextStatus(profile.role, student.status, parsed.data.status);
  const supabase = await createSupabaseServerClient();
  const payload = {
    full_name: parsed.data.full_name,
    identity_number: parsed.data.identity_number,
    father_name: parsed.data.father_name,
    mother_name: parsed.data.mother_name,
    guardian_phone: parsed.data.guardian_phone,
    guardian_phone_2: parsed.data.guardian_phone_2,
    father_job: parsed.data.father_job,
    mother_job: parsed.data.mother_job,
    father_status: parsed.data.father_status,
    mother_status: parsed.data.mother_status,
    family_monthly_income: parsed.data.family_monthly_income,
    home_status: parsed.data.home_status,
    parent_marital_status: parsed.data.parent_marital_status,
    blood_type: parsed.data.blood_type,
    sibling_in_institution: parsed.data.sibling_in_institution,
    birth_date: parsed.data.birth_date,
    registration_date: parsed.data.registration_date,
    course_class_id: parsed.data.course_class_id,
    school_class: parsed.data.school_class,
    school_name: parsed.data.school_name,
    nationality: parsed.data.nationality,
    hometown: parsed.data.hometown,
    address: parsed.data.address,
    status: nextStatus,
    updated_by: profile.id,
  };

  const { error } = await supabase
    .from("students")
    .update(payload)
    .eq("id", parsed.data.id);

  if (error) {
    logSupabaseActionError({
      action: "updateStudentAction",
      profile: { id: profile.id, role: profile.role },
      payload: { id: parsed.data.id, ...payload },
      error,
    });
    redirect(buildSaveRedirect(`/talebeler/${parsed.data.id}/duzenle`, error));
  }

  let uploadedPhotoUrl: string | null = student.photo_url;

  if (photoFile) {
    const uploaded = await uploadStudentPhoto(parsed.data.id, photoFile).catch(() => {
      redirect(`/talebeler/${parsed.data.id}/duzenle?error=photo-upload`);
    });

    if (uploaded) {
      await supabase.from("students").update({ photo_url: uploaded.publicUrl }).eq("id", parsed.data.id);
      uploadedPhotoUrl = uploaded.publicUrl;
    }
  }

  const afterData = {
    ...payload,
    photo_url: uploadedPhotoUrl,
  };

  await createStudentAuditLog({
    ...buildAuditActor(profile),
    action: "student_updated",
    title: "Talebe bilgileri güncellendi",
    description: `${student.full_name} kaydı güncellendi.`,
    entityId: student.id,
    studentId: student.id,
    beforeData: student,
    afterData,
    metadata: {
      status_changed: student.status !== nextStatus,
      class_changed: student.course_class_id !== parsed.data.course_class_id,
    },
  });

  if (student.status !== nextStatus) {
    await createStudentAuditLog({
      ...buildAuditActor(profile),
      action: "student_status_changed",
      title: "Talebe durumu değiştirildi",
      description: `${student.full_name} durumu ${studentStatusLabel(student.status)} durumundan ${studentStatusLabel(nextStatus)} durumuna getirildi.`,
      entityId: student.id,
      studentId: student.id,
      beforeData: { status: student.status },
      afterData: { status: nextStatus },
      metadata: {
        course_class_id: parsed.data.course_class_id,
      },
    });
  }

  if (student.course_class_id !== parsed.data.course_class_id) {
    await createStudentAuditLog({
      ...buildAuditActor(profile),
      action: "student_class_changed",
      title: "Talebe sınıfı değiştirildi",
      description: `${student.full_name} için sınıf değişikliği yapıldı.`,
      entityId: student.id,
      studentId: student.id,
      beforeData: { course_class_id: student.course_class_id },
      afterData: { course_class_id: parsed.data.course_class_id },
      metadata: {
        previous_status: student.status,
        next_status: nextStatus,
      },
    });
  }

  revalidatePath("/talebeler");
  revalidatePath(`/talebeler/${parsed.data.id}`);
  redirect(`/talebeler/${parsed.data.id}?success=updated`);
}

export async function reactivateStudentAction(formData: FormData) {
  const { profile } = await requireAuth();

  if (!canReactivateArchivedStudent(profile)) {
    redirect("/talebeler/arsiv?error=unauthorized");
  }

  const id = String(formData.get("id") ?? "");
  const parsed = z.string().uuid().safeParse(id);

  if (!parsed.success) {
    redirect("/talebeler/arsiv?error=not-found");
  }

  const student = await getStudentById(parsed.data);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("students")
    .update({
      status: "active",
      updated_by: profile.id,
    })
    .eq("id", parsed.data);

  if (error) {
    redirect("/talebeler/arsiv?error=save");
  }

  if (student) {
    await createStudentAuditLog({
      ...buildAuditActor(profile),
      action: "student_status_changed",
      title: "Talebe durumu değiştirildi",
      description: `${student.full_name} yeniden aktif duruma alındı.`,
      entityId: student.id,
      studentId: student.id,
      beforeData: { status: student.status },
      afterData: { status: "active" },
      metadata: {
        source: "arsiv",
      },
    });
  }

  revalidatePath("/talebeler");
  revalidatePath("/talebeler/arsiv");
  redirect(`/talebeler/${parsed.data}`);
}

async function getClassForAction(id: string): Promise<ClassRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("classes").select("*").eq("id", id).eq("is_active", true).maybeSingle();

  if (error) {
    return null;
  }

  return data;
}

function getAllowedNextStatus(role: string, currentStatus: StudentStatus, requestedStatus: StudentStatus) {
  if (role === "hoca") {
    return currentStatus;
  }

  return requestedStatus;
}

function studentStatusLabel(status: StudentStatus) {
  const labels: Record<StudentStatus, string> = {
    active: "Aktif",
    passive: "Pasif",
    graduated: "Mezun",
    left: "Ayrıldı",
  };

  return labels[status];
}

function getPhotoFile(formData: FormData) {
  const value = formData.get("photo");
  return value instanceof File && value.size > 0 ? value : null;
}

function validateStudentPhoto(file: File, path: string) {
  try {
    validateImageFile(file);
  } catch {
    redirect(`${path}?error=photo&errorMessage=` + encodeURIComponent("Fotoğraf yalnızca JPEG, PNG veya WebP formatında ve en fazla 3 MB olabilir."));
  }
}

export async function deleteStudentAction(studentId: string) {
  const { profile } = await requireAuth();
  const supabase = await createSupabaseServerClient();

  const { data: student } = await supabase
    .from("students")
    .select("full_name")
    .eq("id", studentId)
    .single();

  if (!student) {
    return { error: "Talebe bulunamadı." };
  }

  const { error } = await supabase
    .from("students")
    .delete()
    .eq("id", studentId);

  if (error) {
    logSupabaseActionError({ action: "deleteStudent", profile, payload: { id: studentId }, error });
    return { error: buildFriendlyDbErrorMessage(error) };
  }

  await createStudentAuditLog({
    ...buildAuditActor(profile),
    action: "student_deleted",
    title: "Talebe silindi",
    description: `${student.full_name} kaydı silindi.`,
    entityId: studentId,
    studentId,
    beforeData: { full_name: student.full_name },
    afterData: null,
  });

  revalidatePath("/talebeler");
  return { success: true };
}
