"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ProfileOption = {
  id: string;
  full_name: string;
  role: string;
  phone: string | null;
};

interface YeniMesajClientProps {
  recipients: ProfileOption[];
  currentProfileRole: string;
}

function getRoleLabel(role: string) {
  const labels: Record<string, string> = {
    veli: "Veli",
    hoca: "Öğretmen",
    bolum_muduru: "Bölüm Müdürü",
    genel_mudur: "Genel Müdür",
    admin: "Yönetici",
  };
  return labels[role] ?? role;
}

export function YeniMesajClient({ recipients, currentProfileRole }: YeniMesajClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [recipientId, setRecipientId] = useState("");
  const [message, setMessage] = useState("");
  const [sendAsSms, setSendAsSms] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSendSms = currentProfileRole !== "veli";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientId || !message.trim()) return;

    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.append("recipientId", recipientId);
      formData.append("message", message.trim());
      formData.append("sendAsSms", sendAsSms ? "true" : "false");

      const res = await fetch("/api/messages", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        router.push(`/mesajlar/${recipientId}`);
        router.refresh();
      }
    });
  };

  const selectedRecipient = recipients.find((r) => r.id === recipientId);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="recipient">Alıcı</Label>
          <Select value={recipientId} onValueChange={setRecipientId} required>
            <SelectTrigger id="recipient" className="w-full">
              <SelectValue placeholder="Alıcı seçin..." />
            </SelectTrigger>
            <SelectContent>
              {recipients.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  <div className="flex items-center gap-2">
                    <span>{r.full_name}</span>
                    <span className="text-xs text-muted-foreground">({getRoleLabel(r.role)})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedRecipient?.phone && canSendSms && (
          <div className="rounded-md bg-[#f0f7ff] border border-[#e0effe] p-3">
            <div className="flex items-center gap-2 text-sm">
              <Phone className="size-4 text-[#093657]" />
              <span className="text-[#093657]">Telefon: {selectedRecipient.phone}</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="sendAsSms"
                checked={sendAsSms}
                onChange={(e) => setSendAsSms(e.target.checked)}
                className="size-4 rounded border-[#c9d5df]"
              />
              <Label htmlFor="sendAsSms" className="text-sm cursor-pointer">
                SMS olarak gönder ( ekstra )
              </Label>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="message">Mesaj</Label>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Mesajınızı yazın..."
            className="min-h-[150px] resize-none"
            required
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={!recipientId || !message.trim() || isPending}>
          <Send className="mr-1.5 size-4" />
          {isPending ? "Gönderiliyor..." : "Gönder"}
        </Button>
        <Link href="/mesajlar">
          <Button type="button" variant="outline">
            İptal
          </Button>
        </Link>
      </div>
    </form>
  );
}