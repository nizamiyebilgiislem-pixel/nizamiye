import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sendMessage } from "@/lib/messages/actions";

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

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile) {
      return Response.json({ error: "Profile not found" }, { status: 404 });
    }

    const url = new URL(request.url);
    const recipientId = url.searchParams.get("recipientId");

    if (recipientId) {
      const { data: messages } = await supabase
        .from("messages")
        .select(`
          *,
          sender:profiles!messages_sender_profile_id_fkey(id, full_name, role),
          recipient:profiles!messages_recipient_profile_id_fkey(id, full_name, role)
        `)
        .or(`and(sender_profile_id.eq.${profile.id},recipient_profile_id.eq.${recipientId}),and(sender_profile_id.eq.${recipientId},recipient_profile_id.eq.${profile.id})`)
        .order("created_at", { ascending: true });

      await supabase
        .from("messages")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("recipient_profile_id", profile.id)
        .eq("sender_profile_id", recipientId);

      return Response.json(messages || []);
    }

    const { data: conversations } = await supabase
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

    const messages = (conversations ?? []) as MessageData[];

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

    const result = Array.from(conversationMap.values()).sort((a, b) => 
      new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );

    return Response.json(result);
  } catch {
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile) {
      return Response.json({ error: "Profile not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const recipientId = formData.get("recipientId") as string;
    const message = formData.get("message") as string;
    const sendAsSms = formData.get("sendAsSms") === "true";

    if (!recipientId || !message) {
      return Response.json({ error: "Eksik parametreler" }, { status: 400 });
    }

    const result = await sendMessage(profile, recipientId, message, undefined, undefined, sendAsSms);

    if (result.error) {
      return Response.json({ error: result.error }, { status: 400 });
    }

    return Response.json({
      success: true,
      via: result.via,
      smsFailed: result.smsFailed ?? false,
      smsError: result.smsError ?? null
    });
  } catch {
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}