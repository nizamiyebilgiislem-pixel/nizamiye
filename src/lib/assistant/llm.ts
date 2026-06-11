import Groq from "groq-sdk";
import { randomUUID } from "crypto";

import { buildSystemPrompt, buildContextualData } from "./llm-prompt";
import {
  AI_PROVIDER,
  AI_FALLBACK_MODEL,
  AI_PRIMARY_MODEL,
  AI_REQUEST_TIMEOUT_MS,
  buildAiCacheKey,
  checkAiRateLimit,
  getAiUserMessage,
  getCachedAiAnswer,
  logAiAttempt,
  parseAiError,
  runAiModelWithFallbackResult,
  setCachedAiAnswer,
  type RunAiModelParams,
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
  const requestId = randomUUID();
  const startedAt = Date.now();
  const userId = profile.id;
  const primaryModel = AI_PRIMARY_MODEL;
  const fallbackModel = AI_FALLBACK_MODEL;
  const cacheKey = buildAiCacheKey(userId, question, profile.role);

  logAiRequestStart({
    userId,
    model: primaryModel,
    questionLength: question.length,
    requestId,
  });

  const cachedAnswer = getCachedAiAnswer(cacheKey);
  if (cachedAnswer) {
    logAiRequestEnd({
      model: primaryModel,
      status: "ok",
      durationMs: Date.now() - startedAt,
      fromCache: true,
      fallbackUsed: false,
    });
    return { answer: cachedAnswer };
  }

  if (!checkAiRateLimit(userId)) {
    logAiRequestEnd({
      model: primaryModel,
      status: "local_rate_limited",
      durationMs: Date.now() - startedAt,
      fromCache: false,
      fallbackUsed: false,
    });
    return { answer: "Yapay zeka kullanım sınırına ulaştınız. Lütfen kısa bir süre sonra tekrar deneyin." };
  }

  let finalModel = primaryModel;
  let fallbackUsed = false;
  let providerErrorLogged = false;

  try {
    const client = getClient();
    const systemPrompt = buildSystemPrompt(profile);
    const liveData = prebuiltContext ?? (await buildContextualData(profile));
    const response = await askGroqWithFallback(client, {
      question,
      systemPrompt,
      liveData,
      primaryModel,
      fallbackModel,
      requestId,
      logAttempt: (params) => {
        finalModel = params.model;
        fallbackUsed = fallbackUsed || params.fallback;
        providerErrorLogged = true;
        logAiAttempt(params);
      },
    });

    finalModel = response.model;
    fallbackUsed = response.fallbackUsed;
    setCachedAiAnswer(cacheKey, response.result.answer);
    logAiRequestEnd({
      model: response.model,
      status: "ok",
      durationMs: Date.now() - startedAt,
      fromCache: false,
      fallbackUsed: response.fallbackUsed,
    });
    return response.result;
  } catch (err) {
    const error = parseAiError(err);
    if (!providerErrorLogged) {
      logAiError({
        model: finalModel,
        status: error.status,
        message: error.message,
        responseBody: error.responseBody,
        requestId,
      });
    }
    logAiRequestEnd({
      model: finalModel,
      status: error.status ?? error.kind,
      durationMs: Date.now() - startedAt,
      fromCache: false,
      fallbackUsed,
    });
    return { answer: getAiUserMessage(error) };
  }
}

type AskGroqParams = {
  question: string;
  systemPrompt: string;
  liveData: string;
  primaryModel?: string;
  fallbackModel?: string;
  requestId?: string;
  logAttempt?: RunAiModelParams<IntentResult>["logAttempt"];
};

type GroqClient = Pick<Groq, "chat">;

export async function askGroqWithFallback(client: GroqClient, params: AskGroqParams) {
  return runAiModelWithFallbackResult({
    primaryModel: params.primaryModel ?? AI_PRIMARY_MODEL,
    fallbackModel: params.fallbackModel ?? AI_FALLBACK_MODEL,
    requestId: params.requestId,
    logAttempt: params.logAttempt,
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

type LogStartParams = {
  userId: string;
  model: string;
  questionLength: number;
  requestId: string;
};

type LogEndParams = {
  model: string;
  status: string | number;
  durationMs: number;
  fromCache: boolean;
  fallbackUsed: boolean;
};

type LogErrorParams = {
  model: string;
  status?: number;
  message: string;
  responseBody?: string;
  requestId: string;
};

function logAiRequestStart(params: LogStartParams) {
  if (process.env.NODE_ENV === "production") {
    console.log(
      `[AI REQUEST START]\nprovider=${AI_PROVIDER}\nmodel=${params.model}\nquestionLength=${params.questionLength}\nrequestId=${params.requestId}`,
    );
    return;
  }

  console.log(
    `[AI REQUEST START]\nprovider=${AI_PROVIDER}\nuserId=${params.userId}\nmodel=${params.model}\nquestionLength=${params.questionLength}\nrequestId=${params.requestId}`,
  );
}

function logAiRequestEnd(params: LogEndParams) {
  console.log(
    `[AI REQUEST END]\nprovider=${AI_PROVIDER}\nmodel=${params.model}\nstatus=${params.status}\ndurationMs=${params.durationMs}\nfromCache=${params.fromCache}\nfallbackUsed=${params.fallbackUsed}`,
  );
}

function logAiError(params: LogErrorParams) {
  if (process.env.NODE_ENV === "production") {
    console.error(
      `[AI ERROR]\nprovider=${AI_PROVIDER}\nmodel=${params.model}\nstatus=${params.status ?? "none"}\nmessage=${params.message}\nresponseBody=${params.responseBody ? "redacted" : "none"}\nrequestId=${params.requestId}`,
    );
    return;
  }

  console.error(
    `[AI ERROR]\nprovider=${AI_PROVIDER}\nmodel=${params.model}\nstatus=${params.status ?? "none"}\nmessage=${params.message}\nresponseBody=${params.responseBody ?? "none"}\nrequestId=${params.requestId}`,
  );
}
