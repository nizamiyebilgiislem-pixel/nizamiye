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

function maskPhone(phone: string): string {
  if (!phone || phone.length < 6) return "****";
  return phone.slice(0, 5) + "******" + phone.slice(-2);
}

function maskSid(sid: string): string {
  if (!sid || sid.length < 8) return "****";
  return sid.slice(0, 4) + "..." + sid.slice(-4);
}

Deno.serve(async (req: Request) => {
  const requestId = crypto.randomUUID().slice(0, 8);

  console.log(`[${requestId}] send-sms invoked`);
  console.log(`[${requestId}] env check - hasSid: ${!!Deno.env.get("TWILIO_ACCOUNT_SID")}, hasToken: ${!!Deno.env.get("TWILIO_AUTH_TOKEN")}, hasPhone: ${!!Deno.env.get("TWILIO_PHONE_NUMBER")}`);

  try {
    const { to, message }: SMSRequest = await req.json();

    console.log(`[${requestId}] body parsed - hasTo: ${!!to}, hasMessage: ${!!message}`);

    if (!to || !message) {
      return new Response(
        JSON.stringify({ success: false, error: "Telefon numarası ve mesaj gerekli" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const fromNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!accountSid || !authToken || !fromNumber) {
      console.log(`[${requestId}] Twilio env not configured`);
      return new Response(
        JSON.stringify({ success: false, error: "Twilio yapılandırılmamış" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const cleanTo = normalizePhoneNumber(to);
    console.log(`[${requestId}] normalizedTo: ${cleanTo ? maskPhone(cleanTo) : "null"}`);

    if (!cleanTo) {
      return new Response(
        JSON.stringify({ success: false, error: "Geçersiz telefon numarası formatı" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

    const formData = new URLSearchParams();
    formData.append("To", cleanTo);
    formData.append("From", fromNumber);
    formData.append("Body", message);

    console.log(`[${requestId}] Calling Twilio API - to: ${maskPhone(cleanTo)}, from: ${maskPhone(fromNumber)}`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": "Basic " + btoa(`${accountSid}:${authToken}`),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`[${requestId}] Twilio error:`, {
        status: response.status,
        code: data.code,
        message: data.message,
        moreInfo: data.more_info,
      });

      return new Response(
        JSON.stringify({
          success: false,
          error: "twilio-error",
          status: response.status,
          code: data.code,
          message: data.message,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    console.log(`[${requestId}] Success - sid: ${maskSid(data.sid)}, status: ${data.status}`);

    return new Response(
      JSON.stringify({
        success: true,
        sid: data.sid,
        status: data.status,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error(`[${requestId}] Unexpected error:`, error);

    return new Response(
      JSON.stringify({
        success: false,
        error: "Bilinmeyen hata",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});