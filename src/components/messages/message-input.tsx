"use client";

import { useState, useRef, useTransition } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface MessageInputProps {
  onSend: (message: string, sendAsSms?: boolean) => Promise<{ error?: string }>;
  placeholder?: string;
  smsAvailable?: boolean;
  smsLimit?: number;
  smsUsed?: number;
  disabled?: boolean;
}

export function MessageInput({
  onSend,
  placeholder = "Mesajınızı yazın...",
  smsAvailable = false,
  smsLimit = 0,
  smsUsed = 0,
  disabled = false,
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [sendAsSms, setSendAsSms] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const remainingSms = smsLimit - smsUsed;
  const canSendSms = smsAvailable && remainingSms > 0 && sendAsSms;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setError(null);
    startTransition(async () => {
      const result = await onSend(message.trim(), sendAsSms);
      if (result.error) {
        setError(result.error);
      } else {
        setMessage("");
        setSendAsSms(false);
        textareaRef.current?.focus();
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      {error && (
        <div className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-md">
          {error}
        </div>
      )}
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="min-h-[44px] max-h-[120px] resize-none pr-10"
            disabled={disabled || isPending}
            rows={1}
          />
          {message.trim() && (
            <button
              type="button"
              onClick={() => setSendAsSms(!sendAsSms)}
              className={cn(
                "absolute right-2 bottom-2 p-1.5 rounded-full transition-colors",
                sendAsSms
                  ? "bg-[#25d5] text-white"
                  : "bg-[#e8e8e8] text-[#999] hover:bg-[#ddd]"
              )}
              title={
                smsAvailable
                  ? sendAsSms
                    ? "SMS gönderimi aktif"
                    : "SMS ile gönder ( ekstra )"
                  : "SMS gönderilemez"
              }
              disabled={!smsAvailable}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </button>
          )}
        </div>
        <Button
          type="submit"
          size="icon"
          disabled={!message.trim() || disabled || isPending}
          className="shrink-0 size-11 bg-[#25d5] hover:bg-[#20bfb5]"
        >
          {isPending ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          )}
        </Button>
      </div>
      {sendAsSms && smsAvailable && (
        <div className="flex items-center gap-2 text-xs text-[#666]">
          <svg className="w-4 h-4 text-[#25d5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
          <span>SMS ile gönderilecek ({remainingSms} adet kaldı)</span>
        </div>
      )}
      {smsAvailable && remainingSms <= 3 && remainingSms > 0 && (
        <div className="text-[10px] text-amber-600 bg-amber-50 px-2 py-1 rounded">
          ⚠️ SMS limitiniz azaldı ({remainingSms}/{smsLimit})
        </div>
      )}
    </form>
  );
}