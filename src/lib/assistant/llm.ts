import Groq from "groq-sdk";

import { buildSystemPrompt, buildContextualData } from "./llm-prompt";
import type { IntentResult } from "./types";
import type { ProfileRow } from "@/types/database";

let groqClient: Groq | null = null;

function getClient(): Groq {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY ortam değişkeni bulunamadı.");
    }
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
}

export async function askLLM(
  question: string,
  profile: ProfileRow,
  prebuiltContext?: string,
): Promise<IntentResult> {
  try {
    const client = getClient();
    const systemPrompt = buildSystemPrompt(profile);
    const liveData = prebuiltContext ?? (await buildContextualData(profile));

    const response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "system", content: `BUGÜNÜN VERİLERİ:\n${liveData}` },
        { role: "user", content: question },
      ],
      temperature: 0.3,
      max_tokens: 1024,
    });

    const answer = response.choices[0]?.message?.content?.trim() ?? "Cevap oluşturulamadı.";

    return { answer };
  } catch (err) {
    console.error("[assistant:llm]", err);
    const message = err instanceof Error ? err.message : String(err);

    if (message.includes("API key")) {
      return {
        answer:
          "⚠️ Yapay zeka asistanı için API anahtarı tanımlanmamış. `.env.local` dosyasına `GROQ_API_KEY=...` ekleyin ve sayfayı yenileyin.",
      };
    }

    return {
      answer: "😔 Yapay zeka servisine ulaşılamadı. Lütfen daha sonra tekrar deneyin.",
    };
  }
}
