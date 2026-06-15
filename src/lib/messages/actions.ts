"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProfileRow } from "@/types/database";
import { canSendToRecipient, getSmsLimit, getSmsCountForMonth, incrementSmsCount } from "./permissions";
import { sendSMS } from "@/lib/sms";

type MessageSenderRecipient = {
  id: string;
  full_name: string;
  role: string;
};

type MessageData = {
  id: string;
  sender_profile_id: string;
  recipient_profile_id: string;
  subject: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
  sender: MessageSenderRecipient;
  recipient: MessageSenderRecipient;
};

type ConversationItemData = {
  id: string;
  profile: MessageSenderRecipient;
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
};

export async function sendMessage(
  sender: ProfileRow,
  recipientId: string,
  message: string,
  subject?: string,
  studentId?: string,
  sendAsSms = false
) {
  const supabase = createSupabaseAdminClient();

  const { data: recipient } = await supabase
    .from("profiles")
    .select("id, full_name, role, phone")
    .eq("id", recipientId)
    .single();

  if (!recipient) {
    return { error: "Alıcı bulunamadı" };
  }

  if (!canSendToRecipient(sender, recipient.role)) {
    return { error: "Bu kişiye mesaj gönderme yetkiniz yok" };
  }

  let smsFailed = false;
  let smsErrorMessage = null;

  if (sendAsSms && recipient.phone) {
    const currentCount = await getSmsCountForMonth(supabase, sender.id);
    const limit = getSmsLimit(sender.role);

    if (currentCount >= limit) {
      return { error: `Aylık SMS limitinizi doldurdunuz (${limit}/${limit})` };
    }

    const smsResult = await sendSMS(
      recipient.phone,
      `[Nizamiye] ${sender.full_name}: ${message.slice(0, 160)}`
    );

    if (!smsResult.success) {
      smsFailed = true;
      smsErrorMessage = smsResult.error ?? "SMS servisi kullanılamıyor";
    } else {
      await incrementSmsCount(supabase, sender.id);
    }
  }

  await supabase.from("messages").insert({
    sender_profile_id: sender.id,
    recipient_profile_id: recipientId,
    subject: subject ?? null,
    message,
    sent_via: sendAsSms && !smsFailed ? "sms" : "app",
    student_id: studentId ?? null,
  });

  if (smsFailed) {
    return { success: true, via: "app", smsFailed: true, smsError: smsErrorMessage };
  }

  return { success: true, via: sendAsSms && !smsFailed ? "sms" : "app" };

  await supabase.from("messages").insert({
    sender_profile_id: sender.id,
    recipient_profile_id: recipientId,
    subject: subject ?? null,
    message,
    sent_via: "app",
    student_id: studentId ?? null,
  });

  return { success: true, via: "app" };
}

export async function getCurrentUser(server: boolean = true) {
  const supabase = server ? await createSupabaseServerClient() : createSupabaseAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  return profile as ProfileRow | null;
}

export async function getConversationList(profile: ProfileRow) {
  const supabase = createSupabaseAdminClient();

  const { data } = await supabase
    .from("messages")
    .select(`
      id,
      sender_profile_id,
      recipient_profile_id,
      subject,
      message,
      is_read,
      created_at,
      sender:profiles!messages_sender_profile_id_fkey(id, full_name, role),
      recipient:profiles!messages_recipient_profile_id_fkey(id, full_name, role)
    `)
    .or(`sender_profile_id.eq.${profile.id},recipient_profile_id.eq.${profile.id}`)
    .order("created_at", { ascending: false });

  const messages = (data ?? []) as MessageData[];

  const conversationMap = new Map<string, ConversationItemData>();
  for (const msg of messages) {
    const otherId = msg.sender_profile_id === profile.id ? msg.recipient_profile_id : msg.sender_profile_id;
    const otherProfile = msg.sender_profile_id === profile.id ? msg.recipient : msg.sender;
    const key = `${otherId}`;
    if (!conversationMap.has(key)) {
      conversationMap.set(key, {
        id: otherId,
        profile: otherProfile,
        lastMessage: msg.message,
        lastMessageAt: msg.created_at,
        unread: msg.recipient_profile_id === profile.id && !msg.is_read ? 1 : 0,
      });
    } else {
      const existing = conversationMap.get(key)!;
      if (msg.recipient_profile_id === profile.id && !msg.is_read) {
        existing.unread += 1;
      }
    }
  }

  return Array.from(conversationMap.values()).sort((a, b) => 
    new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
  );
}

export async function getRecipientsForSender(sender: ProfileRow) {
  const supabase = createSupabaseAdminClient();

  if (sender.role === "veli") {
    const { data: classData } = await supabase
      .from("parent_student_links")
      .select("student_id")
      .eq("parent_profile_id", sender.id)
      .limit(1);

    if (!classData || classData.length === 0) return [];

    const studentId = classData[0].student_id;

    const { data: student } = await supabase
      .from("students")
      .select("course_class_id")
      .eq("id", studentId)
      .single();

    if (!student?.course_class_id) return [];

    const { data: classTeacher } = await supabase
      .from("profiles")
      .select("id, full_name, role, phone")
      .eq("is_active", true)
      .eq("role", "hoca")
      .limit(1);

    return classTeacher ?? [];
  }

  if (["admin", "genel_mudur"].includes(sender.role)) {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, role, phone")
      .eq("is_active", true)
      .neq("id", sender.id)
      .order("full_name");
    return data ?? [];
  }

  if (sender.role === "bolum_muduru") {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, role, phone")
      .eq("is_active", true)
      .neq("id", sender.id)
      .in("role", ["admin", "genel_mudur", "hoca", "veli"])
      .order("full_name");
    return data ?? [];
  }

  if (sender.role === "hoca") {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, role, phone")
      .eq("is_active", true)
      .neq("id", sender.id)
      .in("role", ["admin", "genel_mudur", "bolum_muduru", "veli"])
      .order("full_name");
    return data ?? [];
  }

  return [];
}