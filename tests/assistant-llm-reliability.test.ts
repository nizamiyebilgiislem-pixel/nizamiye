import test from "node:test";
import assert from "node:assert/strict";

import {
  AI_FALLBACK_MODEL,
  AI_FAST_MODEL,
  AI_PRIMARY_MODEL,
  AI_STRONG_MODEL,
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

test("timeout fallback modele geçer ve timeout kullanıcı mesajına çevrilir", async () => {
  const logs: Array<{ fallback: boolean; status?: number }> = [];
  const timeoutError = new Error("Request timed out.");

  await assert.rejects(
    runAiModelWithRetryAndFallback({
      primaryModel: AI_PRIMARY_MODEL,
      fallbackModel: AI_FALLBACK_MODEL,
      callModel: async () => {
        throw timeoutError;
      },
      logAttempt: (entry) => logs.push({ fallback: entry.fallback, status: entry.status }),
    }),
  );

  const message = getAiUserMessage(parseAiError(timeoutError));
  assert.equal(message, "Yapay zeka yanıt vermekte gecikiyor. Lütfen tekrar deneyin.");
  assert.deepEqual(logs.map((entry) => entry.fallback), [false, true]);
});

test("500 hatası fallback modele geçer", async () => {
  const calls: string[] = [];
  const result = await runAiModelWithRetryAndFallback({
    callModel: async (model) => {
      calls.push(model);
      if (model === AI_PRIMARY_MODEL) throw statusError(500);
      return "fallback-ok";
    },
    logAttempt: () => undefined,
  });

  assert.equal(result, "fallback-ok");
  assert.deepEqual(calls, [AI_PRIMARY_MODEL, AI_FALLBACK_MODEL]);
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
  assert.deepEqual(calls, [AI_PRIMARY_MODEL, AI_FALLBACK_MODEL]);
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
  assert.equal(message, "Yapay zeka kullanım limiti geçici olarak doldu. Lütfen biraz sonra tekrar deneyin.");
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
  assert.equal(message, "Yapay zeka yapılandırması eksik veya hatalı.");
  assert.deepEqual(calls, [AI_PRIMARY_MODEL]);
});

test("varsayılan model sırası güçlü primary ve hızlı fallback kullanır", () => {
  assert.equal(AI_PRIMARY_MODEL, AI_STRONG_MODEL);
  assert.equal(AI_FALLBACK_MODEL, AI_FAST_MODEL);
});
