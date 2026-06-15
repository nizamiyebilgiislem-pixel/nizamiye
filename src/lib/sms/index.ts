export type SMSResult = {
  success: boolean;
  messageId?: string;
  error?: string;
};

function normalizePhoneNumber(phone: string): string {
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");

  if (cleaned.startsWith("+")) {
    return cleaned;
  }

  if (cleaned.startsWith("0")) {
    return "+90" + cleaned.slice(1);
  }

  return "+" + cleaned;
}

export async function sendSMS(to: string, message: string): Promise<SMSResult> {
  const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
    console.warn("Twilio configuration missing. SMS not sent. Env vars check:", {
      hasAccountSid: !!twilioAccountSid,
      hasAuthToken: !!twilioAuthToken,
      hasPhoneNumber: !!twilioPhoneNumber,
    });
    return { success: false, error: "SMS servisi yapılandırılmamış" };
  }

  try {
    const cleanTo = normalizePhoneNumber(to);
    console.log("Sending SMS via Edge Function - to:", cleanTo.slice(0, 6) + "****");

    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-sms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ to: cleanTo, message }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("SMS Edge Function error:", {
        status: response.status,
        error: result.error,
        code: result.code,
      });
      return { success: false, error: result.error || "SMS gönderilemedi" };
    }

    console.log("SMS sent successfully:", result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("SMS send exception:", error);
    return { success: false, error: error instanceof Error ? error.message : "Bilinmeyen hata" };
  }
}

export async function sendNotificationSMS(
  profileId: string,
  title: string,
  message: string,
): Promise<SMSResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return { success: false, error: "Supabase yapılandırması eksik" };
  }

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: profile } = await supabase
      .from("profiles")
      .select("phone")
      .eq("id", profileId)
      .single();

    if (!profile?.phone) {
      return { success: false, error: "Telefon numarası bulunamadı" };
    }

    const fullMessage = `Nizamiye: ${title}\n${message}`;
    return await sendSMS(profile.phone, fullMessage);
  } catch (error) {
    console.error("Notification SMS error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Bilinmeyen hata" };
  }
}