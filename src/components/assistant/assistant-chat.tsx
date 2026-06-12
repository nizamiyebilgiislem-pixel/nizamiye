"use client";

import { useState, useRef, useEffect, useCallback, useSyncExternalStore } from "react";
import { Mic, MicOff, Send, Trash2, User, Volume2, VolumeX, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { askAssistant } from "@/lib/assistant/actions";
import { clearMessages, getMessages } from "@/lib/assistant/messages";
import { AssistantSuggestions } from "./assistant-suggestions";
import { PolaAiAvatar } from "./pola-ai-avatar";
import type { Message } from "@/lib/assistant/types";
import type { ProfileRow } from "@/types/database";

type AssistantChatProps = {
  profile: ProfileRow;
  variant?: "page" | "panel";
  onClose?: () => void;
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
  const bottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const submittingRef = useRef(false);
  const hasPersistedMessages = messages.some((message) => message.id !== "welcome");
  const isPanel = variant === "panel";

  useEffect(() => {
    getMessages(profile).then((loadedMessages) => {
      const nextMessages = loadedMessages.length === 0 ? [getWelcomeMessage()] : loadedMessages;
      setMessages(nextMessages);
      setHistoryLoaded(true);
    });
  }, [profile]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

    submittingRef.current = true;
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: q, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setPending(true);

    try {
      const result = await askAssistant(q);

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
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Bir soru sorun..."
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
