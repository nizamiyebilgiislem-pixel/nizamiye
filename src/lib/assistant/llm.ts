import Groq from "groq-sdk";

import { buildSystemPrompt, buildContextualData } from "./llm-prompt";
import {
  AI_FALLBACK_MODEL,
  AI_PRIMARY_MODEL,
  AI_REQUEST_TIMEOUT_MS,
  getAiUserMessage,
  parseAiError,
  runAiModelWithRetryAndFallback,
} from "./llm-reliability";
import type { IntentResult } from "./types";
import type { ProfileRow } from "@/types/database";

let groqClient: Groq | null = null;

function getClient(): Groq {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY ortam değişkeni bulunamadı.");
    }
    groqClient = new Groq({ apiKey, timeout: AI_REQUEST_TIMEOUT_MS, maxRetries: 0 });
  }
  return groqClient;
}

export async function askLLM(
  question: string,
  profile: ProfileRow,
  prebuiltContext?: string,
): Promise<IntentResult> {
  const systemPrompt = buildSystemPrompt(profile);
  const liveData = prebuiltContext ?? (await buildContextualData(profile));

  try {
    const client = getClient();
    return await askGroqWithFallback(client, {
      question,
      systemPrompt,
      liveData,
    });
  } catch (err) {
    const error = parseAiError(err);
    return { answer: getAiUserMessage(error) };
  }
}

type AskGroqParams = {
  question: string;
  systemPrompt: string;
  liveData: string;
};

type GroqClient = Pick<Groq, "chat">;

export async function askGroqWithFallback(client: GroqClient, params: AskGroqParams): Promise<IntentResult> {
  return runAiModelWithRetryAndFallback({
    primaryModel: AI_PRIMARY_MODEL,
    fallbackModel: AI_FALLBACK_MODEL,
    callModel: (model) => callGroqModel(client, model, params),
  });
}

async function callGroqModel(client: GroqClient, model: string, params: AskGroqParams): Promise<IntentResult> {
  const response = await client.chat.completions.create(
    {
      model,
      messages: [
        { role: "system", content: params.systemPrompt },
        { role: "system", content: `BUGÜNÜN VERİLERİ:\n${params.liveData}` },
        { role: "user", content: params.question },
      ],
      temperature: 0.3,
      max_tokens: 1024,
    },
    {
      timeout: AI_REQUEST_TIMEOUT_MS,
      maxRetries: 0,
    },
  );

  return {
    answer: response.choices[0]?.message?.content?.trim() ?? "Cevap oluşturulamadı.",
  };
}
