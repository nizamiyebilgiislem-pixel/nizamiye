"use server";

import type { ProfileRow } from "@/types/database";
import { matchIntent } from "./intents";
import { executeIntent } from "./queries";
import { askLLM } from "./llm";
import { buildContextualData } from "./llm-prompt";
import { saveMessage } from "./messages";
import type { IntentResult } from "./types";

export async function askAssistant(question: string, profile: ProfileRow): Promise<IntentResult> {
  await saveMessage(profile, "user", question);

  const matched = matchIntent(question);

  let result: IntentResult;

  if (matched.confidence >= 0.3) {
    result = await executeIntent(matched.id, profile, matched.params);
    if (result.answer && !result.answer.includes("bulamadım")) {
      await saveMessage(profile, "assistant", result.answer);
      return result;
    }
  }

  const context = await buildContextualData(profile);
  result = await askLLM(question, profile, context);

  await saveMessage(profile, "assistant", result.answer);
  return result;
}
