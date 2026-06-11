"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, Volume2, VolumeX, Mic, MicOff, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { askAssistant } from "@/lib/assistant/actions";
import { clearMessages, getMessages } from "@/lib/assistant/messages";
import { AssistantSuggestions } from "./assistant-suggestions";
import type { Message } from "@/lib/assistant/types";
import type { ProfileRow } from "@/types/database";

type AssistantChatProps = {
  profile: ProfileRow;
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

const speechSupported = typeof window !== "undefined" && "speechSynthesis" in window;
const recognitionSupported =
  typeof window !== "undefined" &&
  ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

function getWelcomeMessage(profile: ProfileRow): Message {
  return {
    id: "welcome",
    role: "assistant",
    content: `Merhaba ${profile.full_name.split(" ")[0]}! 👋 Ben POLA AI, size nasıl yardımcı olabilirim?`,
    timestamp: new Date(),
  };
}

export function AssistantChat({ profile }: AssistantChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [listening, setListening] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [clearing, setClearing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const hasPersistedMessages = messages.some((message) => message.id !== "welcome");

  useEffect(() => {
    getMessages(profile).then((msgs) => {
      if (msgs.length === 0) {
        msgs = [getWelcomeMessage(profile)];
      }
      setMessages(msgs);
      setHistoryLoaded(true);
    });
  }, [profile]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const speak = useCallback(
    (text: string) => {
      if (!ttsEnabled || !speechSupported) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.replace(/[✅❌📋⚠️🕐🔄🎉🌙📌💡📢🤔🎯💪😄🔥👋]/g, ""));
      utterance.lang = "tr-TR";
      utterance.rate = 1.1;
      window.speechSynthesis.speak(utterance);
    },
    [ttsEnabled],
  );

  async function handleSend(question: string) {
    const q = question.trim();
    if (!q || pending) return;

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
      setPending(false);
    }
  }

  function startListening() {
    if (!recognitionSupported) return;

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
    const confirmed = window.confirm("POLA AI sohbet geçmişinizi silmek istiyor musunuz?");
    if (!confirmed) return;

    setClearing(true);
    try {
      const result = await clearMessages();
      if (result.success) {
        setMessages([getWelcomeMessage(profile)]);
        window.speechSynthesis?.cancel();
      }
    } finally {
      setClearing(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-10rem)] flex-col">
      <Card className="flex flex-1 flex-col overflow-hidden">
        <CardContent className="flex flex-1 flex-col p-0">
          <div className="flex items-center justify-end gap-2 border-b border-[#e5e7eb] px-4 py-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearMessages}
              disabled={!historyLoaded || pending || clearing || !hasPersistedMessages}
              className="gap-1 text-xs text-[#6b7280]"
              title="Sohbet geçmişini sil"
            >
              <Trash2 className="size-3.5" />
              {clearing ? "Siliniyor" : "Sohbeti Temizle"}
            </Button>
            {speechSupported && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTtsEnabled((v) => !v)}
                className="gap-1 text-xs text-[#6b7280]"
              >
                {ttsEnabled ? <Volume2 className="size-3.5" /> : <VolumeX className="size-3.5" />}
                {ttsEnabled ? "Sesli Yanıt Açık" : "Sesli Yanıt Kapalı"}
              </Button>
            )}
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`flex max-w-[80%] gap-3 ${
                    msg.role === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <div
                    className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                      msg.role === "user"
                        ? "bg-[#093657] text-white"
                        : "bg-[#eaf1f6] text-[#093657]"
                    }`}
                  >
                    {msg.role === "user" ? <User className="size-4" /> : <Bot className="size-4" />}
                  </div>
                  <div
                    className={`rounded-lg px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
                      msg.role === "user"
                        ? "bg-[#093657] text-white"
                        : "border border-[#e5e7eb] bg-white"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}

            {pending && (
              <div className="flex justify-start">
                <div className="flex max-w-[80%] gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#eaf1f6] text-[#093657]">
                    <Bot className="size-4" />
                  </div>
                  <div className="rounded-lg border border-[#e5e7eb] bg-white px-4 py-2.5 text-sm">
                    <span className="inline-flex gap-1">
                      <span className="size-1.5 animate-bounce rounded-full bg-[#093657]" />
                      <span className="size-1.5 animate-bounce rounded-full bg-[#093657] [animation-delay:0.1s]" />
                      <span className="size-1.5 animate-bounce rounded-full bg-[#093657] [animation-delay:0.2s]" />
                    </span>
                  </div>
                </div>
              </div>
            )}

            {historyLoaded && messages.length === 1 && (
              <AssistantSuggestions profile={profile} onSelect={handleSend} />
            )}

            <div ref={bottomRef} />
          </div>

          <div className="border-t border-[#e5e7eb] p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(input);
              }}
              className="flex gap-2"
            >
              {recognitionSupported && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={listening ? stopListening : startListening}
                  className={listening ? "border-red-400 text-red-500" : ""}
                >
                  {listening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
                </Button>
              )}
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Bir soru sorun..."
                className="flex-1 rounded-md border border-[#d1dae3] bg-white px-4 py-2 text-sm outline-none focus:border-[#093657] focus:ring-1 focus:ring-[#093657]"
                disabled={pending}
              />
              <Button type="submit" size="icon" disabled={pending || !input.trim()}>
                <Send className="size-4" />
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
