import twilio from "npm:twilio";

interface SMSRequest {
  to: string;
  message: string;
}

function normalizePhoneNumber(phone: string): string | null {
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");

  if (cleaned.startsWith("+90")) {
    return cleaned;
  }

  if (cleaned.startsWith("+")) {
    return "+90" + cleaned.slice(1);
  }

  if (cleaned.startsWith("90") && cleaned.length === 11) {
    return "+" + cleaned;
  }

  if (cleaned.startsWith("0") && cleaned.length === 11) {
    return "+90" + cleaned.slice(1);
  }

  if (cleaned.startsWith("5") && cleaned.length === 10) {
    return "+90" + cleaned;
  }

  return null;
}

function maskPhoneNumber(phone: string): string {
  if (phone.length < 4) return "****";
  return phone.slice(0, 4) + "****" + phone.slice(-4);
}

function maskSid(sid: string): string {
  if (sid.length < 8) return "****";
  return sid.slice(0, 4) + "..." + sid.slice(-4);
}

const client = twilio(
  Deno.env.get("TWILIO_ACCOUNT_SID"),
  Deno.env.get("TWILIO_AUTH_TOKEN"),
);

Deno.serve(async (req: Request) => {
  const requestId = crypto.randomUUID().slice(0, 8);

  try {
    const { to, message }: SMSRequest = await req.json();

    if (!to || !message) {
      console.log(`[${requestId}] Missing params - to: ${!!to}, message: ${!!message}`);
      return new Response(
        JSON.stringify({ error: "Telefon numarası ve mesaj gerekli" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const from = Deno.env.get("TWILIO_PHONE_NUMBER");
    if (!from) {
      console.log(`[${requestId}] TWILIO_PHONE_NUMBER not configured`);
      return new Response(
        JSON.stringify({ error: "Twilio telefon numarası yapılandırılmamış" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const cleanTo = normalizePhoneNumber(to);

    if (!cleanTo) {
      console.log(`[${requestId}] Invalid phone format: ${to}`);
      return new Response(
        JSON.stringify({ error: "Geçersiz telefon numarası formatı" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const maskedTo = maskPhoneNumber(cleanTo);
    const maskedFrom = maskPhoneNumber(from);

    console.log(`[${requestId}] Sending SMS - to: ${maskedTo}, from: ${maskedFrom}, msgLen: ${message.length}`);

    const result = await client.messages.create({
      body: message,
      to: cleanTo,
      from: from,
    });

    console.log(`[${requestId}] Success - sid: ${maskSid(result.sid)}, status: ${result.status}`);

    return new Response(
      JSON.stringify({
        success: true,
        messageId: result.sid,
        status: result.status,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    const twilioError = error as { code?: number; message?: string; status?: number; moreInfo?: string };

    console.error(`[${requestId}] Twilio error:`, {
      code: twilioError.code,
      status: twilioError.status,
      message: twilioError.message,
      moreInfo: twilioError.moreInfo,
    });

    const userMessage = "SMS gönderilemedi";
    return new Response(
      JSON.stringify({
        error: userMessage,
        code: twilioError.code,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});