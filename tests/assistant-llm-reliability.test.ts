import test from "node:test";
import assert from "node:assert/strict";

import {
  AI_FALLBACK_MODEL,
  AI_PRIMARY_MODEL,
  getAiUserMessage,
  parseAiError,
  runAiModelWithRetryAndFallback,
} from "../src/lib/assistant/llm-reliability";

function statusError(status: number) {
  return {
    status,
    error: { message: `status ${status}` },
    message: `status ${status}`,
  };
}

test("normal cevap ilk primary çağrısından döner", async () => {
  const calls: string[] = [];
  const result = await runAiModelWithRetryAndFallback({
    callModel: async (model) => {
      calls.push(model);
      return "ok";
    },
    logAttempt: () => undefined,
  });

  assert.equal(result, "ok");
  assert.deepEqual(calls, [AI_PRIMARY_MODEL]);
});

test("timeout retry edilir ve timeout kullanıcı mesajına çevrilir", async () => {
  const logs: Array<{ attempt: number; retry: boolean }> = [];
  const timeoutError = new Error("Request timed out.");

  await assert.rejects(
    runAiModelWithRetryAndFallback({
      primaryModel: AI_PRIMARY_MODEL,
      fallbackModel: AI_FALLBACK_MODEL,
      callModel: async () => {
        throw timeoutError;
      },
      logAttempt: (entry) => logs.push({ attempt: entry.attempt, retry: entry.retry }),
    }),
  );

  const message = getAiUserMessage(parseAiError(timeoutError));
  assert.equal(message, "Yapay zeka yanıt vermekte gecikiyor. Lütfen tekrar deneyin.");
  assert.equal(logs[0]?.attempt, 1);
  assert.equal(logs[0]?.retry, true);
});

test("500 hatası bir kez retry edilir", async () => {
  const calls: string[] = [];
  const result = await runAiModelWithRetryAndFallback({
    callModel: async (model) => {
      calls.push(model);
      if (calls.length === 1) throw statusError(500);
      return "retry-ok";
    },
    logAttempt: () => undefined,
  });

  assert.equal(result, "retry-ok");
  assert.deepEqual(calls, [AI_PRIMARY_MODEL, AI_PRIMARY_MODEL]);
});

test("primary başarısız olursa fallback model kullanılır", async () => {
  const calls: string[] = [];
  const result = await runAiModelWithRetryAndFallback({
    callModel: async (model) => {
      calls.push(model);
      if (model === AI_PRIMARY_MODEL) throw statusError(503);
      return "fallback-ok";
    },
    logAttempt: () => undefined,
  });

  assert.equal(result, "fallback-ok");
  assert.deepEqual(calls, [AI_PRIMARY_MODEL, AI_PRIMARY_MODEL, AI_FALLBACK_MODEL]);
});

test("429 retry ve fallback yapmaz", async () => {
  const calls: string[] = [];

  await assert.rejects(
    runAiModelWithRetryAndFallback({
      callModel: async (model) => {
        calls.push(model);
        throw statusError(429);
      },
      logAttempt: () => undefined,
    }),
  );

  const message = getAiUserMessage(parseAiError(statusError(429)));
  assert.equal(message, "Yapay zeka kullanım limiti geçici olarak doldu.");
  assert.deepEqual(calls, [AI_PRIMARY_MODEL]);
});

test("401 yapılandırma mesajına çevrilir ve retry yapmaz", async () => {
  const calls: string[] = [];

  await assert.rejects(
    runAiModelWithRetryAndFallback({
      callModel: async (model) => {
        calls.push(model);
        throw statusError(401);
      },
      logAttempt: () => undefined,
    }),
  );

  const message = getAiUserMessage(parseAiError(statusError(401)));
  assert.equal(message, "Yapay zeka yapılandırması eksik.");
  assert.deepEqual(calls, [AI_PRIMARY_MODEL]);
});
