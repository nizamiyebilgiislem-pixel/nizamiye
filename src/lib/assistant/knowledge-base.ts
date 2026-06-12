import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AiKnowledgeBaseRow } from "@/types/database";

const KNOWLEDGE_CACHE_TTL_MS = 5 * 60 * 1000;
const MIN_MATCH_SCORE = 20;

type KnowledgeBaseHit = {
  id: string;
  category: string;
  answer: string;
  priority: number;
  score: number;
};

let cachedEntries: AiKnowledgeBaseRow[] | null = null;
let cacheExpiresAt = 0;

export async function findKnowledgeBaseAnswer(question: string): Promise<KnowledgeBaseHit | null> {
  const normalizedQuestion = normalizeText(question);
  if (!normalizedQuestion) return null;

  const entries = await getKnowledgeBaseEntries();
  let bestHit: KnowledgeBaseHit | null = null;

  for (const entry of entries) {
    const score = scoreEntry(normalizedQuestion, entry);
    if (score < MIN_MATCH_SCORE) continue;

    const hit: KnowledgeBaseHit = {
      id: entry.id,
      category: entry.category,
      answer: entry.answer,
      priority: entry.priority,
      score,
    };

    if (
      !bestHit ||
      hit.priority > bestHit.priority ||
      (hit.priority === bestHit.priority && hit.score > bestHit.score)
    ) {
      bestHit = hit;
    }
  }

  return bestHit;
}

async function getKnowledgeBaseEntries() {
  const now = Date.now();
  if (cachedEntries && now < cacheExpiresAt) {
    return cachedEntries;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("ai_knowledge_base")
    .select("id,category,question,answer,keywords,priority,is_active,created_at,updated_at")
    .eq("is_active", true)
    .order("priority", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[assistant:knowledge-base] query failed", error.message);
    cachedEntries = [];
    cacheExpiresAt = now + 30_000;
    return cachedEntries;
  }

  cachedEntries = data ?? [];
  cacheExpiresAt = now + KNOWLEDGE_CACHE_TTL_MS;
  return cachedEntries;
}

function scoreEntry(normalizedQuestion: string, entry: AiKnowledgeBaseRow) {
  const normalizedEntryQuestion = normalizeText(entry.question);
  const keywords = entry.keywords.map(normalizeText).filter(Boolean);
  let score = 0;

  if (normalizedQuestion === normalizedEntryQuestion) {
    score += 220;
  } else {
    if (normalizedQuestion.includes(normalizedEntryQuestion) || normalizedEntryQuestion.includes(normalizedQuestion)) {
      score += 90;
    }

    const entryTokens = significantTokens(normalizedEntryQuestion);
    const questionTokens = new Set(significantTokens(normalizedQuestion));
    const overlapCount = entryTokens.filter((token) => questionTokens.has(token)).length;

    score += overlapCount * 8;
    if (entryTokens.length > 0 && overlapCount >= Math.ceil(entryTokens.length * 0.6)) {
      score += 35;
    }
  }

  for (const keyword of keywords) {
    if (keyword.length < 2) continue;
    if (normalizedQuestion.includes(keyword)) {
      score += keyword.includes(" ") ? 30 : 18;
      continue;
    }

    const keywordTokens = significantTokens(keyword);
    if (keywordTokens.length > 1 && keywordTokens.every((token) => normalizedQuestion.includes(token))) {
      score += 22;
    }
  }

  return score;
}

function normalizeText(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .replaceAll("ç", "c")
    .replaceAll("ğ", "g")
    .replaceAll("ı", "i")
    .replaceAll("ö", "o")
    .replaceAll("ş", "s")
    .replaceAll("ü", "u")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function significantTokens(value: string) {
  const stopWords = new Set([
    "bir",
    "ve",
    "ile",
    "icin",
    "mi",
    "mu",
    "midir",
    "mudur",
    "nedir",
    "hakkinda",
    "bilgi",
    "ver",
    "verir",
    "misin",
    "nasil",
  ]);

  return value
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !stopWords.has(token));
}
