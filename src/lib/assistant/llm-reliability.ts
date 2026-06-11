export const AI_PROVIDER = "groq";
export const AI_REQUEST_TIMEOUT_MS = 20_000;
export const AI_FAST_MODEL = "llama-3.1-8b-instant";
export const AI_STRONG_MODEL = "llama-3.3-70b-versatile";
export const AI_PRIMARY_MODEL = process.env.GROQ_MODEL ?? AI_STRONG_MODEL;
export const AI_FALLBACK_MODEL = process.env.GROQ_FALLBACK_MODEL ?? AI_FAST_MODEL;
export const AI_RATE_LIMIT_WINDOW_MS = 60_000;
export const AI_RATE_LIMIT_MAX_REQUESTS = 3;
export const AI_CACHE_TTL_MS = 120_000;

export type AiErrorKind =
  | "configuration"
  | "permission"
  | "rate_limit"
  | "server"
  | "timeout"
  | "network"
  | "unknown";

export type AiErrorInfo = {
  kind: AiErrorKind;
  status?: number;
  message: string;
  responseBody?: string;
  timeoutMs?: number;
};

type LogAiAttemptParams = {
  model: string;
  fallback: boolean;
  requestId?: string;
  status?: number;
  responseBody?: string;
  timeoutMs?: number;
  error?: unknown;
};

export type RunAiModelParams<T> = {
  primaryModel?: string;
  fallbackModel?: string;
  callModel: (model: string) => Promise<T>;
  logAttempt?: (params: LogAiAttemptParams) => void;
  requestId?: string;
};

export type AiRunResult<T> = {
  result: T;
  model: string;
  fallbackUsed: boolean;
};

type RateLimitEntry = {
  timestamps: number[];
};

type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

const rateLimitStore = new Map<string, RateLimitEntry>();
const answerCache = new Map<string, CacheEntry<string>>();

export async function runAiModelWithRetryAndFallback<T>({
  primaryModel = AI_PRIMARY_MODEL,
  fallbackModel = AI_FALLBACK_MODEL,
  callModel,
  logAttempt = logAiAttempt,
  requestId,
}: RunAiModelParams<T>): Promise<T> {
  try {
    return await callModel(primaryModel);
  } catch (primaryError) {
    const error = parseAiError(primaryError);
    logAttempt({
      model: primaryModel,
      fallback: false,
      requestId,
      status: error.status,
      responseBody: error.responseBody,
      timeoutMs: error.timeoutMs,
      error: primaryError,
    });

    if (!shouldUseFallbackModel(error)) {
      throw primaryError;
    }

    try {
      return await callModel(fallbackModel);
    } catch (fallbackError) {
      const fallbackInfo = parseAiError(fallbackError);
      logAttempt({
        model: fallbackModel,
        fallback: true,
        requestId,
        status: fallbackInfo.status,
        responseBody: fallbackInfo.responseBody,
        timeoutMs: fallbackInfo.timeoutMs,
        error: fallbackError,
      });
      throw fallbackError;
    }
  }
}

export function getAiUserMessage(error: AiErrorInfo) {
  if (error.kind === "configuration") {
    return "Yapay zeka yapılandırması eksik veya hatalı.";
  }

  if (error.kind === "rate_limit") {
    return "Yapay zeka kullanım limiti geçici olarak doldu. Lütfen biraz sonra tekrar deneyin.";
  }

  if (error.kind === "timeout") {
    return "Yapay zeka yanıt vermekte gecikiyor. Lütfen tekrar deneyin.";
  }

  if (error.kind === "server") {
    return "Yapay zeka servisinde geçici bir sorun oluştu. Lütfen tekrar deneyin.";
  }

  return "Yapay zeka servisine ulaşılamadı. Lütfen daha sonra tekrar deneyin.";
}

export async function runAiModelWithFallbackResult<T>(
  params: RunAiModelParams<T>,
): Promise<AiRunResult<T>> {
  const primaryModel = params.primaryModel ?? AI_PRIMARY_MODEL;
  const fallbackModel = params.fallbackModel ?? AI_FALLBACK_MODEL;

  try {
    return {
      result: await params.callModel(primaryModel),
      model: primaryModel,
      fallbackUsed: false,
    };
  } catch (primaryError) {
    const error = parseAiError(primaryError);
    (params.logAttempt ?? logAiAttempt)({
      model: primaryModel,
      fallback: false,
      requestId: params.requestId,
      status: error.status,
      responseBody: error.responseBody,
      timeoutMs: error.timeoutMs,
      error: primaryError,
    });

    if (!shouldUseFallbackModel(error)) {
      throw primaryError;
    }

    try {
      return {
        result: await params.callModel(fallbackModel),
        model: fallbackModel,
        fallbackUsed: true,
      };
    } catch (fallbackError) {
      const fallbackInfo = parseAiError(fallbackError);
      (params.logAttempt ?? logAiAttempt)({
        model: fallbackModel,
        fallback: true,
        requestId: params.requestId,
        status: fallbackInfo.status,
        responseBody: fallbackInfo.responseBody,
        timeoutMs: fallbackInfo.timeoutMs,
        error: fallbackError,
      });
      throw fallbackError;
    }
  }
}

export function shouldRetryAiError(error: AiErrorInfo) {
  if (error.kind === "timeout" || error.kind === "network") return true;
  return error.status === 500 || error.status === 502 || error.status === 503;
}

export function shouldUseFallbackModel(error: AiErrorInfo) {
  if (error.kind === "configuration" || error.kind === "permission" || error.kind === "rate_limit") {
    return false;
  }

  return shouldRetryAiError(error);
}

export function normalizeAiQuestion(question: string) {
  return question.trim().toLocaleLowerCase("tr-TR").replace(/\s+/g, " ");
}

export function buildAiCacheKey(userId: string, question: string, role: string) {
  return `${userId}:${role}:${normalizeAiQuestion(question)}`;
}

export function getCachedAiAnswer(cacheKey: string, now = Date.now()) {
  const cached = answerCache.get(cacheKey);
  if (!cached) return null;

  if (cached.expiresAt <= now) {
    answerCache.delete(cacheKey);
    return null;
  }

  return cached.value;
}

export function setCachedAiAnswer(cacheKey: string, answer: string, now = Date.now()) {
  answerCache.set(cacheKey, {
    value: answer,
    expiresAt: now + AI_CACHE_TTL_MS,
  });
}

export function checkAiRateLimit(userId: string, now = Date.now()) {
  const windowStart = now - AI_RATE_LIMIT_WINDOW_MS;
  const entry = rateLimitStore.get(userId) ?? { timestamps: [] };
  entry.timestamps = entry.timestamps.filter((timestamp) => timestamp > windowStart);

  if (entry.timestamps.length >= AI_RATE_LIMIT_MAX_REQUESTS) {
    rateLimitStore.set(userId, entry);
    return false;
  }

  entry.timestamps.push(now);
  rateLimitStore.set(userId, entry);
  return true;
}

export function parseAiError(error: unknown, timeoutMs = AI_REQUEST_TIMEOUT_MS): AiErrorInfo {
  const status = getErrorStatus(error);
  const message = getErrorMessage(error);
  const responseBody = getResponseBody(error);

  if (message.includes("GROQ_API_KEY") || message.toLocaleLowerCase("tr-TR").includes("api key")) {
    return { kind: "configuration", status, message, responseBody };
  }

  if (isTimeoutError(error, message)) {
    return { kind: "timeout", status, message, responseBody, timeoutMs };
  }

  if (status === 401) {
    return { kind: "configuration", status, message, responseBody };
  }

  if (status === 403) {
    return { kind: "permission", status, message, responseBody };
  }

  if (status === 429) {
    return { kind: "rate_limit", status, message, responseBody };
  }

  if (status && status >= 500) {
    return { kind: "server", status, message, responseBody };
  }

  if (
    message.toLocaleLowerCase("tr-TR").includes("fetch failed") ||
    message.toLocaleLowerCase("tr-TR").includes("network") ||
    message.toLocaleLowerCase("tr-TR").includes("connection")
  ) {
    return { kind: "network", status, message, responseBody };
  }

  return { kind: "unknown", status, message, responseBody };
}

export function logAiAttempt(params: LogAiAttemptParams) {
  const info = parseAiError(params.error, params.timeoutMs);
  const status = params.status ?? info.status ?? "none";
  const responseBody = params.responseBody ?? info.responseBody ?? "none";
  const safeResponseBody = process.env.NODE_ENV === "production" && responseBody !== "none" ? "redacted" : responseBody;

  console.error(
    `[AI ERROR]\nprovider=${AI_PROVIDER}\nmodel=${params.model}\nstatus=${status}\nmessage=${info.message}\nresponseBody=${safeResponseBody}\nrequestId=${params.requestId ?? "none"}`,
  );
}

function getErrorStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  const status = (error as { status?: unknown }).status;
  return typeof status === "number" ? status : undefined;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Unknown AI error";
}

function getResponseBody(error: unknown) {
  if (typeof error !== "object" || error === null) return undefined;
  const body = (error as { error?: unknown }).error;
  if (!body) return undefined;
  if (typeof body === "string") return body;

  try {
    return JSON.stringify(body);
  } catch {
    return String(body);
  }
}

function isTimeoutError(error: unknown, message: string) {
  if (error instanceof Error && error.name === "AbortError") return true;
  const lower = message.toLocaleLowerCase("tr-TR");
  return lower.includes("timeout") || lower.includes("timed out") || lower.includes("aborted");
}
