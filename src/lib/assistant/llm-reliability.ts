export const AI_PROVIDER = "groq";
export const AI_REQUEST_TIMEOUT_MS = 20_000;
export const AI_PRIMARY_MODEL = "llama-3.3-70b-versatile";
export const AI_FALLBACK_MODEL = "llama-3.1-8b-instant";

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
  attempt: number;
  retry: boolean;
  fallback: boolean;
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
};

export async function runAiModelWithRetryAndFallback<T>({
  primaryModel = AI_PRIMARY_MODEL,
  fallbackModel = AI_FALLBACK_MODEL,
  callModel,
  logAttempt = logAiAttempt,
}: RunAiModelParams<T>): Promise<T> {
  try {
    return await runAiModelWithRetry(primaryModel, callModel, false, logAttempt);
  } catch (primaryError) {
    const error = parseAiError(primaryError);
    if (!shouldUseFallbackModel(error)) {
      throw primaryError;
    }

    return runAiModelWithRetry(fallbackModel, callModel, true, logAttempt);
  }
}

export function getAiUserMessage(error: AiErrorInfo) {
  if (error.kind === "configuration") {
    return "Yapay zeka yapılandırması eksik.";
  }

  if (error.kind === "rate_limit") {
    return "Yapay zeka kullanım limiti geçici olarak doldu.";
  }

  if (error.kind === "timeout") {
    return "Yapay zeka yanıt vermekte gecikiyor. Lütfen tekrar deneyin.";
  }

  if (error.kind === "server") {
    return "Yapay zeka servisinde geçici sorun oluştu.";
  }

  return "Yapay zeka servisine ulaşılamadı. Lütfen daha sonra tekrar deneyin.";
}

async function runAiModelWithRetry<T>(
  model: string,
  callModel: (model: string) => Promise<T>,
  fallback: boolean,
  logAttempt: (params: LogAiAttemptParams) => void,
): Promise<T> {
  try {
    return await callModel(model);
  } catch (firstError) {
    const error = parseAiError(firstError);
    const shouldRetry = shouldRetryAiError(error);
    logAttempt({
      model,
      attempt: 1,
      retry: shouldRetry,
      fallback,
      status: error.status,
      responseBody: error.responseBody,
      timeoutMs: error.timeoutMs,
      error: firstError,
    });

    if (!shouldRetry) {
      throw firstError;
    }
  }

  try {
    return await callModel(model);
  } catch (retryError) {
    const error = parseAiError(retryError);
    logAttempt({
      model,
      attempt: 2,
      retry: false,
      fallback,
      status: error.status,
      responseBody: error.responseBody,
      timeoutMs: error.timeoutMs,
      error: retryError,
    });
    throw retryError;
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

  return shouldRetryAiError(error) || error.kind === "server" || error.kind === "unknown";
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
  const timeout = params.timeoutMs ? `${params.timeoutMs}ms` : "none";

  console.error(
    `[AI] provider=${AI_PROVIDER} model=${params.model} status=${status} timeout=${timeout} retry=${params.retry} attempt=${params.attempt} fallback=${params.fallback} response_body=${responseBody}`,
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
