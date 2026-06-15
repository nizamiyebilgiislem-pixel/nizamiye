import twilio from "twilio";

interface SMSRequest {
  to: string;
  message: string;
}

const client = twilio(
  Deno.env.get("TWILIO_ACCOUNT_SID"),
  Deno.env.get("TWILIO_AUTH_TOKEN"),
);

Deno.serve(async (req: Request) => {
  try {
    const { to, message }: SMSRequest = await req.json();

    if (!to || !message) {
      return new Response(
        JSON.stringify({ error: "Telefon numarası ve mesaj gerekli" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const from = Deno.env.get("TWILIO_PHONE_NUMBER");
    if (!from) {
      return new Response(
        JSON.stringify({ error: "Twilio telefon numarası yapılandırılmamış" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const cleanTo = to.replace(/\s+/g, "").replace(/^0/, "+90");

    const result = await client.messages.create({
      body: message,
      to: cleanTo,
      from: from,
    });

    return new Response(
      JSON.stringify({
        success: true,
        messageId: result.sid,
        status: result.status,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("SMS gönderim hatası:", error);
    return new Response(
      JSON.stringify({
        error: "SMS gönderilemedi",
        details: error instanceof Error ? error.message : "Bilinmeyen hata",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});