import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createAuditLog, buildAuditActor } from "@/lib/audit/log";
import { requireAuth } from "@/lib/auth";
import {
  canManageDormitoryAssignments,
  canManageDormitoryStructure,
  canManageDormitories,
} from "@/lib/dormitory/permissions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { JsonValue, ProfileRow } from "@/types/database";

const dormitorySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2),
  description: z.string().trim().optional().transform((value) => (value && value.length > 0 ? value : null)),
  is_active: z.string().optional(),
});

const floorSchema = z.object({
  dormitory_id: z.string().uuid(),
  name: z.string().trim().min(1),
  floor_no: z.string().optional().transform((value) => (value && value.length > 0 ? Number(value) : null)),
});

const roomSchema = z.object({
  floor_id: z.string().uuid(),
  name: z.string().trim().min(1),
  room_no: z.string().trim().optional().transform((value) => (value && value.length > 0 ? value : null)),
  capacity: z.string().trim().transform((value) => Number(value)).pipe(z.number().int().min(1).max(20)),
  note: z.string().trim().optional().transform((value) => (value && value.length > 0 ? value : null)),
});

const bedSchema = z.object({
  room_id: z.string().uuid(),
  bed_no: z.string().trim().min(1),
  note: z.string().trim().optional().transform((value) => (value && value.length > 0 ? value : null)),
});

const assignmentSchema = z.object({
  student_id: z.string().uuid(),
  bed_id: z.string().uuid(),
  start_date: z.string().trim().min(1),
  note: z.string().trim().optional().transform((value) => (value && value.length > 0 ? value : null)),
});

const endAssignmentSchema = z.object({
  id: z.string().uuid(),
  end_date: z.string().trim().optional(),
});

export async function createDormitoryAction(formData: FormData) {
  const { profile } = await requireAuth();
  if (!canManageDormitories(profile)) {
    return { error: "Yetkiniz yok." };
  }

  const parsed = dormitorySchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: "Yatakhane bilgileri geçersiz." };
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("dormitories").insert({
    name: parsed.data.name,
    description: parsed.data.description,
    is_active: parsed.data.is_active === "on",
  });

  if (error) {
    return { error: "Yatakhane oluşturulamadı." };
  }

  await safeAudit(profile, {
    action: "dormitory_created",
    entityType: "dormitory",
    title: `${parsed.data.name} yatakhanesi oluşturuldu`,
    metadata: { name: parsed.data.name },
  });

  revalidatePath("/yatakhane");
  return { success: true };
}

export async function updateDormitoryAction(formData: FormData) {
  const { profile } = await requireAuth();
  if (!canManageDormitories(profile)) {
    return { error: "Yetkiniz yok." };
  }

  const parsed = dormitorySchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success || !parsed.data.id) {
    return { error: "Yatakhane bilgileri geçersiz." };
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("dormitories")
    .update({
      name: parsed.data.name,
      description: parsed.data.description,
      is_active: parsed.data.is_active === "on",
    })
    .eq("id", parsed.data.id);

  if (error) {
    return { error: "Yatakhane güncellenemedi." };
  }

  await safeAudit(profile, {
    action: "dormitory_updated",
    entityType: "dormitory",
    entityId: parsed.data.id,
    title: `${parsed.data.name} yatakhanesi güncellendi`,
    metadata: { name: parsed.data.name },
  });

  revalidatePath("/yatakhane");
  revalidatePath(`/yatakhane/${parsed.data.id}`);
  return { success: true };
}

export async function createDormitoryFloorAction(formData: FormData) {
  const { profile } = await requireAuth();
  if (!canManageDormitoryStructure(profile)) {
    return { error: "Yetkiniz yok." };
  }

  const parsed = floorSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: "Kat bilgileri geçersiz." };
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("dormitory_floors").insert({
    dormitory_id: parsed.data.dormitory_id,
    name: parsed.data.name,
    floor_no: parsed.data.floor_no,
    is_active: true,
  });

  if (error) {
    return { error: "Kat oluşturulamadı." };
  }

  await safeAudit(profile, {
    action: "dormitory_floor_created",
    entityType: "dormitory_floor",
    entityId: parsed.data.dormitory_id,
    title: `${parsed.data.name} katı oluşturuldu`,
    metadata: { dormitory_id: parsed.data.dormitory_id, floor_no: parsed.data.floor_no },
  });

  revalidatePath(`/yatakhane/${parsed.data.dormitory_id}`);
  return { success: true };
}

export async function createDormitoryRoomAction(formData: FormData) {
  const { profile } = await requireAuth();
  if (!canManageDormitoryStructure(profile)) {
    return { error: "Yetkiniz yok." };
  }

  const parsed = roomSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: "Oda bilgileri geçersiz." };
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("dormitory_rooms").insert({
    floor_id: parsed.data.floor_id,
    name: parsed.data.name,
    room_no: parsed.data.room_no,
    capacity: parsed.data.capacity,
    note: parsed.data.note,
    is_active: true,
  });

  if (error) {
    return { error: "Oda oluşturulamadı." };
  }

  await safeAudit(profile, {
    action: "dormitory_room_created",
    entityType: "dormitory_room",
    entityId: parsed.data.floor_id,
    title: `${parsed.data.name} odası oluşturuldu`,
    metadata: { floor_id: parsed.data.floor_id, capacity: parsed.data.capacity },
  });

  revalidatePath(`/yatakhane/katlar/${parsed.data.floor_id}`);
  return { success: true };
}

export async function autoCreateBedsAction(formData: FormData) {
  const { profile } = await requireAuth();
  if (!canManageDormitoryStructure(profile)) {
    return { error: "Yetkiniz yok." };
  }

  const roomId = String(formData.get("room_id") ?? "");
  if (!roomId) {
    return { error: "Oda seçimi gerekli." };
  }

  const supabase = createSupabaseAdminClient();
  const { data: room } = await supabase.from("dormitory_rooms").select("*").eq("id", roomId).maybeSingle();
  if (!room) {
    return { error: "Oda bulunamadı." };
  }

  const desiredBeds = Array.from({ length: Number(room.capacity) }, (_, index) => `Yatak ${index + 1}`);
  const { data: existingBeds } = await supabase.from("dormitory_beds").select("bed_no").eq("room_id", roomId);
  const existing = new Set((existingBeds ?? []).map((bed) => bed.bed_no));
  const rows = desiredBeds.filter((bedNo) => !existing.has(bedNo)).map((bedNo) => ({ room_id: roomId, bed_no: bedNo, is_active: true }));

  if (rows.length === 0) {
    return { error: "Oluşturulacak yeni yatak yok." };
  }

  const { error } = await supabase.from("dormitory_beds").insert(rows);
  if (error) {
    return { error: "Yataklar oluşturulamadı." };
  }

  await safeAudit(profile, {
    action: "dormitory_beds_autogenerated",
    entityType: "dormitory_room",
    entityId: roomId,
    title: `${room.name} odası için yataklar otomatik oluşturuldu`,
    metadata: { room_id: roomId, count: rows.length },
  });

  revalidatePath(`/yatakhane/odalar/${roomId}`);
  return { success: true };
}

export async function createDormitoryBedAction(formData: FormData) {
  const { profile } = await requireAuth();
  if (!canManageDormitoryStructure(profile)) {
    return { error: "Yetkiniz yok." };
  }

  const parsed = bedSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: "Yatak bilgileri geçersiz." };
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("dormitory_beds").insert({
    room_id: parsed.data.room_id,
    bed_no: parsed.data.bed_no,
    note: parsed.data.note,
    is_active: true,
  });

  if (error) {
    return { error: "Yatak oluşturulamadı." };
  }

  await safeAudit(profile, {
    action: "dormitory_bed_created",
    entityType: "dormitory_bed",
    entityId: parsed.data.room_id,
    title: `${parsed.data.bed_no} yatağı oluşturuldu`,
    metadata: { room_id: parsed.data.room_id, bed_no: parsed.data.bed_no },
  });

  revalidatePath(`/yatakhane/odalar/${parsed.data.room_id}`);
  return { success: true };
}

export async function createDormitoryAssignmentAction(formData: FormData) {
  const { profile } = await requireAuth();
  if (!canManageDormitoryAssignments(profile)) {
    return { error: "Yetkiniz yok." };
  }

  const parsed = assignmentSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: "Yerleşim bilgileri geçersiz." };
  }

  const supabase = createSupabaseAdminClient();
  const { data: existingActive } = await supabase
    .from("dormitory_assignments")
    .select("*")
    .eq("student_id", parsed.data.student_id)
    .eq("status", "active")
    .maybeSingle();
  if (existingActive) {
    return { error: "Bu talebenin aktif yerleşimi var. Önce sonlandırın." };
  }

  const { data: bedActive } = await supabase.from("dormitory_assignments").select("*").eq("bed_id", parsed.data.bed_id).eq("status", "active").maybeSingle();
  if (bedActive) {
    return { error: "Seçilen yatak dolu." };
  }

  const { error } = await supabase.from("dormitory_assignments").insert({
    student_id: parsed.data.student_id,
    bed_id: parsed.data.bed_id,
    start_date: parsed.data.start_date,
    note: parsed.data.note,
    status: "active",
    assigned_by: profile.id,
  });

  if (error) {
    return { error: "Yerleşim oluşturulamadı." };
  }

  await safeAudit(profile, {
    action: "dormitory_assignment_created",
    entityType: "dormitory_assignment",
    studentId: parsed.data.student_id,
    title: "Talebe yatakhaneye yerleştirildi",
    metadata: { bed_id: parsed.data.bed_id, start_date: parsed.data.start_date },
  });

  revalidatePath("/yatakhane/yerlesim");
  revalidatePath(`/talebeler/${parsed.data.student_id}`);
  return { success: true };
}

export async function endDormitoryAssignmentAction(formData: FormData) {
  const { profile } = await requireAuth();
  if (!canManageDormitoryAssignments(profile)) {
    return { error: "Yetkiniz yok." };
  }

  const parsed = endAssignmentSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: "Yerleşim sonlandırma bilgileri geçersiz." };
  }

  const supabase = createSupabaseAdminClient();
  const endDate = parsed.data.end_date ?? new Date().toISOString().slice(0, 10);
  const { data: assignment } = await supabase.from("dormitory_assignments").select("*").eq("id", parsed.data.id).maybeSingle();
  if (!assignment) {
    return { error: "Yerleşim bulunamadı." };
  }

  const { error } = await supabase
    .from("dormitory_assignments")
    .update({ status: "ended", end_date: endDate })
    .eq("id", parsed.data.id);

  if (error) {
    return { error: "Yerleşim sonlandırılamadı." };
  }

  await safeAudit(profile, {
    action: "dormitory_assignment_ended",
    entityType: "dormitory_assignment",
    entityId: parsed.data.id,
    studentId: assignment.student_id,
    title: "Yerleşim sonlandırıldı",
    metadata: { end_date: endDate, bed_id: assignment.bed_id },
  });

  revalidatePath("/yatakhane/yerlesim");
  revalidatePath(`/talebeler/${assignment.student_id}`);
  return { success: true };
}

async function safeAudit(
  profile: ProfileRow,
  input: { action: string; entityType: string; entityId?: string | null; studentId?: string | null; title: string; metadata?: JsonValue | null },
) {
  await createAuditLog({
    ...buildAuditActor(profile),
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    studentId: input.studentId ?? null,
    title: input.title,
    metadata: input.metadata ?? null,
  });
}
