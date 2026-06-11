"use server";

import type { ProfileRow } from "@/types/database";
import { buildAuditActor, createAuditLog } from "@/lib/audit/log";
import { requireAuth } from "@/lib/auth";
import { canUseAssistant } from "./access";
import { matchIntent } from "./intents";
import { executeIntent } from "./queries";
import { askLLM } from "./llm";
import { buildContextualData } from "./llm-prompt";
import { saveMessage } from "./messages";
import type { IntentResult } from "./types";

export async function askAssistant(question: string, _clientProfile?: ProfileRow): Promise<IntentResult> {
  const { profile } = await requireAuth();

  if (!canUseAssistant(profile)) {
    return { answer: "Bu işlem için yetkiniz bulunmamaktadır. Yetki işlemleri için Emin Nusret Polat ile iletişime geçebilirsiniz." };
  }

  await saveMessage(profile, "user", question);

  const matched = matchIntent(question);

  let result: IntentResult;

  if (matched.confidence >= 0.3) {
    result = await executeIntent(matched.id, profile, matched.params);
    if (result.answer && !result.answer.includes("bulamadım")) {
      await saveMessage(profile, "assistant", result.answer);
      await logAssistantAsk(profile, question, matched.id, matched.confidence, result.answer);
      return result;
    }
  }

  const context = await buildContextualData(profile);
  result = await askLLM(question, profile, context);

  await saveMessage(profile, "assistant", result.answer);
  await logAssistantAsk(profile, question, matched.id, matched.confidence, result.answer);
  return result;
}

async function logAssistantAsk(
  profile: ProfileRow,
  question: string,
  intentId: string,
  confidence: number,
  answer: string,
) {
  await createAuditLog({
    ...buildAuditActor(profile),
    action: "assistant_question_asked",
    entityType: "assistant",
    title: "POLA AI sorgusu yapıldı",
    description: question.slice(0, 240),
    metadata: {
      intentId,
      confidence,
      answerPreview: answer.slice(0, 500),
    },
  });
}
