import type { ProfileRow } from "@/types/database";

type RecipientProfile = Pick<ProfileRow, "id" | "full_name" | "role" | "phone">;

export type MessageDirection = "sent" | "received";

export type AllowedRecipientRole = "hoca" | "veli" | "bolum_muduru" | "genel_mudur" | "admin";

const SMS_LIMITS: Record<string, number> = {
  veli: 10,
  hoca: 20,
  bolum_muduru: Infinity,
  genel_mudur: Infinity,
  admin: Infinity,
};

export function getSmsLimit(role: string): number {
  return SMS_LIMITS[role] ?? 0;
}

export function canSendToRecipient(sender: ProfileRow, recipientRole: string): boolean {
  const senderRole = sender.role;

  if (["admin", "genel_mudur"].includes(senderRole)) {
    return true;
  }

  if (senderRole === "bolum_muduru") {
    return ["admin", "genel_mudur", "hoca", "veli"].includes(recipientRole);
  }

  if (senderRole === "hoca") {
    return ["admin", "genel_mudur", "bolum_muduru", "veli"].includes(recipientRole);
  }

  if (senderRole === "veli") {
    return recipientRole === "hoca";
  }

  return false;
}

export function canViewMessage(profile: ProfileRow, message: { sender_profile_id: string; recipient_profile_id: string }) {
  return message.sender_profile_id === profile.id || message.recipient_profile_id === profile.id;
}

export function canReplyToMessage(profile: ProfileRow, originalMessage: { sender_profile_id: string; recipient_profile_id: string }) {
  return originalMessage.recipient_profile_id === profile.id;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getRecipientsForSender(supabase: any, sender: ProfileRow): Promise<RecipientProfile[]> {
  if (["admin", "genel_mudur"].includes(sender.role)) {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, role, phone")
      .eq("is_active", true)
      .order("full_name");
    return (data ?? []) as RecipientProfile[];
  }

  if (sender.role === "bolum_muduru") {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, role, phone")
      .eq("is_active", true)
      .in("role", ["admin", "genel_mudur", "hoca", "veli"])
      .order("full_name");
    return (data ?? []) as RecipientProfile[];
  }

  if (sender.role === "hoca") {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, role, phone")
      .eq("is_active", true)
      .in("role", ["admin", "genel_mudur", "bolum_muduru", "veli"])
      .order("full_name");
    return (data ?? []) as RecipientProfile[];
  }

  if (sender.role === "veli") {
    const { data: classTeacher } = await supabase
      .from("profiles")
      .select("id, full_name, role, phone")
      .eq("is_active", true)
      .eq("role", "hoca")
      .limit(1);
    return (classTeacher ?? []) as RecipientProfile[];
  }

  return [];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getSmsCountForMonth(supabase: any, profileId: string): Promise<number> {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const { data } = await supabase
    .from("monthly_sms_limits")
    .select("sms_count")
    .eq("profile_id", profileId)
    .eq("year_month", yearMonth)
    .single();

  return (data as { sms_count?: number } | null)?.sms_count ?? 0;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function incrementSmsCount(supabase: any, profileId: string): Promise<void> {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const { data: existing } = await supabase
    .from("monthly_sms_limits")
    .select("id, sms_count")
    .eq("profile_id", profileId)
    .eq("year_month", yearMonth)
    .single();

  const existingData = existing as { id: string; sms_count: number } | null;
  if (existingData) {
    await supabase
      .from("monthly_sms_limits")
      .update({ sms_count: existingData.sms_count + 1 })
      .eq("id", existingData.id);
  } else {
    await supabase
      .from("monthly_sms_limits")
      .insert({ profile_id: profileId, year_month: yearMonth, sms_count: 1 });
  }
}