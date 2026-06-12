"use client";

import { useState, useRef, useEffect, useCallback, useSyncExternalStore } from "react";
import { Mic, MicOff, Send, Trash2, User, Volume2, VolumeX, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { askAssistant } from "@/lib/assistant/actions";
import { clearMessages, getMessages } from "@/lib/assistant/messages";
import {
  getAssistantQuickCommandSummaryAction,
  searchAssistantQuickCommandAction,
  type AssistantQuickCommand,
  type AssistantQuickSummaryType,
} from "@/lib/assistant/quick-commands";
import { AssistantSuggestions } from "./assistant-suggestions";
import { PolaAiAvatar } from "./pola-ai-avatar";
import type { Message } from "@/lib/assistant/types";
import type { ProfileRow } from "@/types/database";

type AssistantChatProps = {
  profile: ProfileRow;
  variant?: "page" | "panel";
  onClose?: () => void;
};

type QuickCommandCardState = {
  id: string;
  command: AssistantQuickCommand;
};

type QuickSearchItem = {
  id: string;
  title: string;
  subtitle?: string;
  meta: string[];
};

type QuickSummary = {
  title?: string;
  lines: string[];
  error?: string;
};

type QuickContext = {
  command: AssistantQuickCommand;
  item: QuickSearchItem;
  summary?: QuickSummary;
};

const quickCommandLabels: Record<AssistantQuickCommand, string> = {
  student: "Talebe",
  department: "Bölüm",
  class: "Sınıf",
  dormitory: "Yatakhane",
};

const quickCommandPrompts: Record<AssistantQuickCommand, string> = {
  student: "Kimi görüntülemek istiyorsunuz?",
  department: "Hangi bölümü görüntülemek istiyorsunuz?",
  class: "Hangi sınıfı görüntülemek istiyorsunuz?",
  dormitory: "Hangi yatakhaneyi görüntülemek istiyorsunuz?",
};

const summaryOptions: Record<AssistantQuickCommand, Array<{ type: AssistantQuickSummaryType; label: string }>> = {
  student: [
    { type: "general", label: "Genel Bilgi" },
    { type: "grades", label: "Not Özeti" },
    { type: "attendance", label: "Yoklama Özeti" },
    { type: "guidance", label: "Rehberlik Özeti" },
    { type: "infirmary", label: "Revir Özeti" },
    { type: "term_history", label: "Dönem Geçmişi" },
  ],
  department: [
    { type: "general", label: "Bölüm Özeti" },
    { type: "classes", label: "Sınıflar" },
    { type: "students", label: "Öğrenciler" },
    { type: "attendance", label: "Yoklama Özeti" },
  ],
  class: [
    { type: "general", label: "Sınıf Özeti" },
    { type: "students", label: "Öğrenci Listesi" },
    { type: "attendance", label: "Yoklama Özeti" },
    { type: "courses", label: "Dersler" },
    { type: "grades", label: "Not Özeti" },
  ],
  dormitory: [
    { type: "occupancy", label: "Doluluk Özeti" },
    { type: "students", label: "Öğrenci Listesi" },
    { type: "capacity", label: "Boş Kontenjan" },
  ],
};

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
  length: number;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

function getWelcomeMessage(): Message {
  return {
    id: "welcome",
    role: "assistant",
    content:
      "Merhaba, ben Nizam Aİ.\nNizamiye Öğrenci Bilgi Sistemi içerisinde size yardımcı olabilirim.",
    timestamp: new Date(),
  };
}

function subscribeToClientSnapshot() {
  return () => {};
}

export function AssistantChat({ profile, variant = "page", onClose }: AssistantChatProps) {
  const mounted = useSyncExternalStore(subscribeToClientSnapshot, () => true, () => false);
  const speechSupported = useSyncExternalStore(
    subscribeToClientSnapshot,
    () => "speechSynthesis" in window,
    () => false,
  );
  const recognitionSupported = useSyncExternalStore(
    subscribeToClientSnapshot,
    () => "SpeechRecognition" in window || "webkitSpeechRecognition" in window,
    () => false,
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [listening, setListening] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [quickCards, setQuickCards] = useState<QuickCommandCardState[]>([]);
  const [quickContext, setQuickContext] = useState<QuickContext | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const submittingRef = useRef(false);
  const hasPersistedMessages = messages.some((message) => message.id !== "welcome");
  const isPanel = variant === "panel";
  const [mentionItems, setMentionItems] = useState<QuickSearchItem[]>([]);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionLoading, setMentionLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const mention = getMentionQuery(input);

    const timer = window.setTimeout(() => {
      if (!mention || mention.query.length < 1) {
        setMentionItems([]);
        setMentionOpen(false);
        setMentionLoading(false);
        return;
      }

      setMentionOpen(true);
      setMentionLoading(true);
      searchAssistantQuickCommandAction("student", mention.query)
        .then((result) => {
          if (cancelled) return;
          setMentionItems(result.items);
        })
        .finally(() => {
          if (!cancelled) setMentionLoading(false);
        });
    }, mention ? 180 : 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [input]);

  useEffect(() => {
    getMessages(profile).then((loadedMessages) => {
      const nextMessages = loadedMessages.length === 0 ? [getWelcomeMessage()] : loadedMessages;
      setMessages(nextMessages);
      setHistoryLoaded(true);
    });
  }, [profile]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, quickCards.length]);

  const speak = useCallback(
    (text: string) => {
      if (!mounted || !ttsEnabled || !speechSupported) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "tr-TR";
      utterance.rate = 1.05;
      window.speechSynthesis.speak(utterance);
    },
    [mounted, speechSupported, ttsEnabled],
  );

  async function handleSend(question: string) {
    const q = question.trim();
    if (!q || pending || submittingRef.current) return;

    const quickCommand = parseQuickCommand(q);
    if (quickCommand) {
      const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: q, timestamp: new Date() };
      setMessages((prev) => [...prev, userMsg]);
      setQuickCards((prev) => [...prev, { id: crypto.randomUUID(), command: quickCommand }]);
      setInput("");
      return;
    }

    const cleanQuestion = quickContext ? removeMentionFromQuestion(q, quickContext.item.title) : q;
    const contextualQuestion = quickContext ? `${quickContext.item.title} hakkında: ${cleanQuestion}` : q;

    submittingRef.current = true;
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: q, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setPending(true);

    try {
      const result = await askAssistant(contextualQuestion);

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: result.answer,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      speak(result.answer);
    } catch {
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Bir hata oluştu. Lütfen tekrar deneyin.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      submittingRef.current = false;
      setPending(false);
    }
  }

  function selectMentionItem(item: QuickSearchItem) {
    const mention = getMentionQuery(input);
    setQuickContext({ command: "student", item });
    setMentionOpen(false);
    setMentionItems([]);

    if (!mention) {
      setInput((value) => `${value.trim()} @${item.title} `.trimStart());
      inputRef.current?.focus();
      return;
    }

    setInput(`${input.slice(0, mention.start)}@${item.title} ${input.slice(mention.end).trimStart()}`);
    inputRef.current?.focus();
  }

  function startListening() {
    if (!mounted || !recognitionSupported) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "tr-TR";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setListening(false);
    };

    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  async function handleClearMessages() {
    if (pending || clearing || !hasPersistedMessages) return;
    const confirmed = window.confirm("Nizam Aİ sohbet geçmişini silmek istiyor musunuz?");
    if (!confirmed) return;

    setClearing(true);
    try {
      const result = await clearMessages();
      if (result.success) {
        setMessages([getWelcomeMessage()]);
        if (mounted) {
          window.speechSynthesis?.cancel();
        }
      }
    } finally {
      setClearing(false);
    }
  }

  return (
    <div className={isPanel ? "flex h-[min(70vh,40rem)] flex-col" : "flex h-[calc(100vh-10rem)] flex-col"}>
      <Card className="flex flex-1 flex-col overflow-hidden border-[#dbe5ec] shadow-sm">
        <CardContent className="flex flex-1 flex-col p-0">
          <div className="flex items-center justify-between gap-3 border-b border-[#e5e7eb] bg-white px-4 py-3">
            <div className="flex items-center gap-3">
              <PolaAiAvatar size={44} className="shadow-[0_8px_20px_rgba(9,54,87,0.14)]" priority={isPanel} />
              <div>
                <p className="text-sm font-semibold text-[#093657]">Nizam Aİ</p>
                <p className="text-xs text-[#64748b]">Dijital Yardımcı</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {mounted && speechSupported ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTtsEnabled((value) => !value)}
                  className="gap-1 text-xs text-[#6b7280]"
                >
                  {ttsEnabled ? <Volume2 className="size-3.5" /> : <VolumeX className="size-3.5" />}
                  {ttsEnabled ? "Sesli Yanıt Açık" : "Sesli Yanıt Kapalı"}
                </Button>
              ) : null}

              {isPanel && onClose ? (
                <Button type="button" variant="ghost" size="icon-sm" onClick={onClose} aria-label="Nizam Aİ panelini kapat">
                  <X className="size-4" />
                </Button>
              ) : null}
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto bg-[#fbfcfd] p-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`flex max-w-[88%] gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  {msg.role === "user" ? (
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#093657] text-white shadow-sm">
                      <User className="size-4" />
                    </div>
                  ) : (
                    <PolaAiAvatar size={36} className="shadow-[0_6px_14px_rgba(9,54,87,0.16)]" />
                  )}

                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line shadow-sm ${
                      msg.role === "user" ? "bg-[#093657] text-white" : "border border-[#e5e7eb] bg-white text-[#0f172a]"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}

            {quickCards.map((card) => (
              <QuickCommandCard
                key={card.id}
                command={card.command}
                onSelect={(context, closeAfterSelect = false) => {
                  setQuickContext(context);
                  if (closeAfterSelect) {
                    setQuickCards((prev) => prev.filter((item) => item.id !== card.id));
                    requestAnimationFrame(() => inputRef.current?.focus());
                  }
                }}
                onSummary={(context) => {
                  setQuickContext(context);
                  setMessages((prev) => [...prev, quickSummaryToMessage(context.summary)]);
                }}
                onClose={() => setQuickCards((prev) => prev.filter((item) => item.id !== card.id))}
              />
            ))}

            {pending && (
              <div className="flex justify-start">
                <div className="flex max-w-[88%] gap-3">
                  <PolaAiAvatar size={36} className="shadow-[0_6px_14px_rgba(9,54,87,0.16)]" />
                  <div className="rounded-2xl border border-[#e5e7eb] bg-white px-4 py-3 text-sm shadow-sm">
                    <span className="inline-flex gap-1">
                      <span className="size-1.5 animate-bounce rounded-full bg-[#093657]" />
                      <span className="size-1.5 animate-bounce rounded-full bg-[#093657] [animation-delay:0.1s]" />
                      <span className="size-1.5 animate-bounce rounded-full bg-[#093657] [animation-delay:0.2s]" />
                    </span>
                  </div>
                </div>
              </div>
            )}

            {historyLoaded && messages.length === 1 ? <AssistantSuggestions profile={profile} onSelect={handleSend} /> : null}

            <div ref={bottomRef} />
          </div>

          <div className="border-t border-[#e5e7eb] bg-white p-4">
            {quickContext ? (
              <div className="mb-2 flex flex-wrap items-center gap-2 rounded-lg border border-[#dbe5ec] bg-[#f8fafc] px-3 py-2 text-xs">
                <span className="font-medium text-[#093657]">Bağlam:</span>
                <span className="rounded-full bg-[#093657] px-2 py-0.5 text-white">@{quickContext.item.title}</span>
                <button
                  type="button"
                  onClick={() => setQuickContext(null)}
                  className="ml-auto rounded-md px-2 py-1 text-[#64748b] hover:bg-white"
                >
                  Temizle
                </button>
              </div>
            ) : null}

            {mentionOpen ? (
              <div className="mb-2 max-h-56 overflow-y-auto rounded-xl border border-[#dbe5ec] bg-white p-2 text-sm shadow-lg">
                {mentionLoading ? <div className="px-3 py-2 text-xs text-[#64748b]">Talebeler aranıyor...</div> : null}
                {!mentionLoading && mentionItems.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-[#64748b]">Talebe bulunamadı.</div>
                ) : null}
                {!mentionLoading
                  ? mentionItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => selectMentionItem(item)}
                        className="block w-full rounded-lg px-3 py-2 text-left hover:bg-[#f8fafc]"
                      >
                        <span className="block font-medium text-[#0f172a]">@{item.title}</span>
                        <span className="block text-xs text-[#64748b]">{[item.subtitle, ...item.meta].filter(Boolean).join(" / ")}</span>
                      </button>
                    ))
                  : null}
              </div>
            ) : null}

            <form
              onSubmit={(event) => {
                event.preventDefault();
                handleSend(input);
              }}
              className="flex gap-2"
            >
              {mounted && recognitionSupported ? (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={listening ? stopListening : startListening}
                  className={listening ? "border-red-400 text-red-500" : ""}
                  aria-label={listening ? "Sesli girişi durdur" : "Sesli giriş başlat"}
                >
                  {listening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
                </Button>
              ) : null}

              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleClearMessages}
                disabled={!historyLoaded || pending || clearing || !hasPersistedMessages}
                title="Sohbet geçmişini sil"
                aria-label="Sohbet geçmişini sil"
              >
                <Trash2 className="size-4" />
              </Button>

              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={quickContext ? `${quickContext.item.title} için devam sorusu sorun...` : "@talebe adı veya bir soru yazın..."}
                className="flex-1 rounded-md border border-[#d1dae3] bg-white px-4 py-2 text-sm outline-none focus:border-[#093657] focus:ring-1 focus:ring-[#093657]"
                disabled={pending}
              />

              <Button type="submit" size="icon" disabled={pending || !input.trim()} aria-label="Mesaj gönder">
                <Send className="size-4" />
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function quickSummaryToMessage(summary?: QuickSummary): Message {
  return {
    id: crypto.randomUUID(),
    role: "assistant",
    content: summary?.error
      ? summary.error
      : `${summary?.title ?? "Hızlı Özet"}\n${(summary?.lines ?? []).join("\n")}`,
    timestamp: new Date(),
  };
}

function parseQuickCommand(value: string): AssistantQuickCommand | null {
  const command = value.trim().toLocaleLowerCase("tr-TR");
  if (["/talebe", "/öğrenci", "/ogrenci"].includes(command)) return "student";
  if (["/bolum", "/bölüm"].includes(command)) return "department";
  if (["/sinif", "/sınıf"].includes(command)) return "class";
  if (command === "/yatakhane") return "dormitory";
  return null;
}

function getMentionQuery(value: string) {
  const atIndex = value.lastIndexOf("@");
  if (atIndex < 0) return null;

  const afterMention = value.slice(atIndex + 1);
  if (afterMention.includes("\n")) return null;

  return {
    start: atIndex,
    end: value.length,
    query: afterMention.trim(),
  };
}

function removeMentionFromQuestion(question: string, name: string) {
  return question.replaceAll(`@${name}`, "").replace(/\s+/g, " ").trim() || "Genel bilgi ver.";
}

function QuickCommandCard({
  command,
  onSelect,
  onSummary,
  onClose,
}: {
  command: AssistantQuickCommand;
  onSelect: (context: QuickContext, closeAfterSelect?: boolean) => void;
  onSummary: (context: QuickContext) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<QuickSearchItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<QuickSearchItem | null>(null);
  const [summary, setSummary] = useState<QuickSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      searchAssistantQuickCommandAction(command, query)
        .then((result) => {
          if (cancelled) return;
          setItems(result.items);
          setError(result.error ?? null);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [command, query]);

  async function loadSummary(type: AssistantQuickSummaryType) {
    if (!selectedItem) return;
    setSummaryLoading(true);
    setSummary(null);
    try {
      const result = await getAssistantQuickCommandSummaryAction(command, selectedItem.id, type);
      setSummary(result);
      onSummary({ command, item: selectedItem, summary: result });
    } finally {
      setSummaryLoading(false);
    }
  }

  return (
    <div className="flex justify-start">
      <div className="flex max-w-[96%] gap-3">
        <PolaAiAvatar size={36} className="shadow-[0_6px_14px_rgba(9,54,87,0.16)]" />
        <div className="max-h-[min(62vh,34rem)] w-[min(34rem,100%)] overflow-y-auto rounded-2xl border border-[#dbe5ec] bg-white p-4 text-sm shadow-sm">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-[#093657]">{quickCommandLabels[command]} Seçici</p>
              <p className="text-xs text-[#64748b]">{quickCommandPrompts[command]}</p>
            </div>
            <button type="button" onClick={onClose} className="rounded-md px-2 py-1 text-xs text-[#64748b] hover:bg-[#eef4f8]">
              Kapat
            </button>
          </div>

          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSelectedItem(null);
              setSummary(null);
            }}
            placeholder="Ara..."
            className="mb-3 h-9 w-full rounded-md border border-[#d1dae3] px-3 text-sm outline-none focus:border-[#093657] focus:ring-1 focus:ring-[#093657]"
          />

          {error ? <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">{error}</div> : null}
          {loading ? <div className="rounded-md bg-[#f8fafc] p-3 text-xs text-[#64748b]">Sonuçlar yükleniyor...</div> : null}

          {!loading && !error ? (
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {items.length === 0 ? (
                <div className="rounded-md bg-[#f8fafc] p-3 text-xs text-[#64748b]">Sonuç bulunamadı.</div>
              ) : (
                items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedItem(item);
                      setSummary(null);
                      onSelect({ command, item });
                    }}
                    onDoubleClick={() => {
                      setSelectedItem(item);
                      setSummary(null);
                      onSelect({ command, item }, true);
                    }}
                    className={`w-full rounded-lg border p-3 text-left transition ${
                      selectedItem?.id === item.id ? "border-[#093657] bg-[#eef4f8]" : "border-[#e5e7eb] hover:bg-[#f8fafc]"
                    }`}
                  >
                    <span className="block font-medium text-[#0f172a]">{item.title}</span>
                    {item.subtitle ? <span className="block text-xs text-[#64748b]">{item.subtitle}</span> : null}
                    <span className="mt-2 flex flex-wrap gap-1">
                      {item.meta.map((meta) => (
                        <span key={meta} className="rounded-full bg-[#edf3f7] px-2 py-0.5 text-[11px] text-[#47677d]">
                          {meta}
                        </span>
                      ))}
                    </span>
                    <span className="mt-2 block text-xs font-medium text-[#093657]">
                      Seç, sohbete bağla ve özet seçeneklerini göster
                    </span>
                  </button>
                ))
              )}
            </div>
          ) : null}

          {selectedItem ? (
            <div className="mt-4 border-t border-[#e5e7eb] pt-3">
              <div className="mb-2 rounded-md bg-[#eef4f8] px-3 py-2">
                <p className="text-xs font-medium text-[#093657]">Seçili kayıt: {selectedItem.title}</p>
                <p className="text-xs text-[#64748b]">
                  Sohbet bağlamına eklendi. Aşağıdan devam sorusu yazabilir veya hızlı özet seçebilirsiniz.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {summaryOptions[command].map((option) => (
                  <Button key={option.type} type="button" variant="outline" size="xs" onClick={() => loadSummary(option.type)} disabled={summaryLoading}>
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}

          {summaryLoading ? <div className="mt-3 rounded-md bg-[#f8fafc] p-3 text-xs text-[#64748b]">Özet hazırlanıyor...</div> : null}
          {summary ? (
            <div className="mt-3 rounded-lg border border-[#dbe5ec] bg-[#fbfcfd] p-3">
              {summary.error ? (
                <p className="text-sm text-amber-800">{summary.error}</p>
              ) : (
                <>
                  <p className="mb-2 font-semibold text-[#093657]">{summary.title}</p>
                  <ul className="space-y-1 text-sm text-[#334155]">
                    {summary.lines.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
