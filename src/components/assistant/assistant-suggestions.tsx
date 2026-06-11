"use client";

import {
  ClipboardCheck,
  Stethoscope,
  UserPlus,
  BookOpen,
  ListTodo,
  Video,
  Library,
  Bell,
  Sparkles,
} from "lucide-react";

import type { ProfileRow } from "@/types/database";

type AssistantSuggestionsProps = {
  profile: ProfileRow;
  onSelect: (question: string) => void;
};

const adminSuggestions = [
  { icon: ClipboardCheck, label: "Bugün yoklama alındı mı?", question: "Bugün yoklama alındı mı?" },
  { icon: Stethoscope, label: "Bugün revir kaydı var mı?", question: "Bugün revir kaydı var mı?" },
  { icon: UserPlus, label: "Yeni öğrenci kaydı var mı?", question: "Bugün yeni öğrenci kaydı var mı?" },
  { icon: ListTodo, label: "Bugünün görevleri", question: "Bugün hangi görevler var?" },
  { icon: Video, label: "Canlı oturum var mı?", question: "Bugün canlı oturum var mı?" },
  { icon: Library, label: "Gecikmiş kitap var mı?", question: "Gecikmiş kitap var mı?" },
  { icon: Bell, label: "Aktif duyurular", question: "Aktif duyuru var mı?" },
  { icon: Sparkles, label: "Bugünün özeti", question: "Bugünün özeti nedir?" },
];

const teacherSuggestions = [
  { icon: ClipboardCheck, label: "Sınıfımda yoklama alındı mı?", question: "Sınıfımda yoklama alındı mı?" },
  { icon: BookOpen, label: "Ders programım nedir?", question: "Ders programım nedir?" },
  { icon: ListTodo, label: "Görevlerim", question: "Bugün hangi görevler var?" },
  { icon: Bell, label: "Duyurular", question: "Aktif duyuru var mı?" },
];

export function AssistantSuggestions({ profile, onSelect }: AssistantSuggestionsProps) {
  const isAdminOrManager = ["admin", "genel_mudur", "bolum_muduru"].includes(profile.role);
  const suggestions = isAdminOrManager ? adminSuggestions : teacherSuggestions;

  return (
    <div className="space-y-3">
      <p className="text-center text-xs text-muted-foreground">Hızlı erişim için bir soru seçin:</p>
      <div className="flex flex-wrap justify-center gap-2">
        {suggestions.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.question}
              type="button"
              onClick={() => onSelect(s.question)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#e5e7eb] bg-white px-3 py-1.5 text-xs text-muted-foreground shadow-sm transition-colors hover:border-[#093657]/30 hover:text-[#093657]"
            >
              <Icon className="size-3.5" />
              {s.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
