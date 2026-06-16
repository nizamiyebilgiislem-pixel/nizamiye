"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckSquare, Search, Square } from "lucide-react";

import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { useToast } from "@/components/toast/toast-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createSessionAction, updateSessionAction } from "@/lib/live-sessions/actions";
import type { LiveSessionParticipantOption } from "@/lib/live-sessions/queries";
import { cn } from "@/lib/utils";
import type { LiveSessionRow } from "@/types/database";
import type { UserRole } from "@/types/rbac";

const sessionTypeOptions = [
  { value: "ogretmen_toplantisi", label: "Öğretmen Toplantısı" },
  { value: "konuk_semineri", label: "Konuk Semineri" },
  { value: "bolum_toplantisi", label: "Bölüm Toplantısı" },
  { value: "veli_gorusmesi", label: "Veli Görüşmesi" },
  { value: "ozel_etkinlik", label: "Özel Etkinlik" },
];

const participantRoleLabels: Record<UserRole, string> = {
  admin: "Admin",
  genel_mudur: "Genel Müdür",
  bolum_muduru: "Bölüm Müdürü",
  hoca: "Hoca",
  rehberlik: "Rehberlik",
  destek_birim_muduru: "Destek Birim Müdürü",
  kutuphane_gorevlisi: "Kütüphane Görevlisi",
  veli: "Veli",
  sponsor: "Sponsor",
  muhasebe: "Muhasebe",
};

type SessionFormProps = {
  session?: LiveSessionRow;
  departmentOptions: { id: string; name: string }[];
  participantOptions: LiveSessionParticipantOption[];
  initialParticipantIds?: string[];
  currentProfileRole: string;
};

type ActionState = {
  success?: boolean;
  sessionId?: string;
  error?: string;
};

export function SessionForm({
  session,
  departmentOptions,
  participantOptions,
  initialParticipantIds = [],
  currentProfileRole,
}: SessionFormProps) {
  const action = session ? updateSessionAction : createSessionAction;
  const [state, formAction] = useActionState<ActionState | undefined, FormData>(action, undefined);
  const router = useRouter();
  const { addToast } = useToast();
  const initialAllStaff = Boolean(session?.is_all_staff);
  const allParticipantIds = useMemo(() => participantOptions.map((participant) => participant.id), [participantOptions]);
  const [allStaffSelected, setAllStaffSelected] = useState(initialAllStaff);
  const [selectedIds, setSelectedIds] = useState<string[]>(initialAllStaff ? allParticipantIds : initialParticipantIds);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const defaults = getDefaultDateTimeParts(session);

  useEffect(() => {
    if (!state?.success || !state.sessionId) return;

    addToast("success", session ? "Oturum güncellendi." : "Oturum oluşturuldu.", "Toplantı detay sayfası açılıyor.");
    router.push(`/canli-oturumlar/${state.sessionId}`);
  }, [addToast, router, session, state]);

  const showDepartment = ["admin", "genel_mudur"].includes(currentProfileRole);
  const filteredParticipants = participantOptions.filter((participant) => {
    const matchesSearch = search.trim()
      ? participant.full_name.toLocaleLowerCase("tr-TR").includes(search.trim().toLocaleLowerCase("tr-TR"))
      : true;
    const matchesRole = roleFilter === "all" || participant.role === roleFilter;
    return matchesSearch && matchesRole;
  });
  const selectedSet = new Set(selectedIds);
  const selectedCount = selectedIds.length;

  function toggleParticipant(id: string) {
    setAllStaffSelected(false);
    setSelectedIds((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));
  }

  function toggleAllStaff() {
    setAllStaffSelected((current) => {
      const next = !current;
      setSelectedIds(next ? allParticipantIds : []);
      return next;
    });
  }

  function clearSelection() {
    setAllStaffSelected(false);
    setSelectedIds([]);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{session ? "Oturumu Düzenle" : "Yeni Oturum"}</CardTitle>
          <CardDescription>
            {session ? "Oturum bilgilerini güncelleyin." : "Kurum içi Jitsi toplantısı planlayın. Oda adı otomatik oluşturulacaktır."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-5">
            {session && <input type="hidden" name="id" value={session.id} />}
            {allStaffSelected ? <input type="hidden" name="is_all_staff" value="on" /> : null}
            {selectedIds.map((id) => (
              <input key={id} type="hidden" name="participant_profile_ids" value={id} />
            ))}

            <label className="grid gap-2 text-sm font-medium">
              Başlık *
              <input
                name="title"
                required
                defaultValue={session?.title ?? ""}
                placeholder="Oturum başlığı"
                className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium">
              Açıklama
              <textarea
                name="description"
                rows={3}
                defaultValue={session?.description ?? ""}
                placeholder="Oturum açıklaması"
                className="rounded-md border border-input bg-background px-3 py-2 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium">
                Oturum Türü *
                <select
                  name="session_type"
                  required
                  defaultValue={session?.session_type ?? ""}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20"
                >
                  <option value="">Tür seçin</option>
                  {sessionTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-medium">
                Maks. Katılımcı
                <input
                  type="number"
                  name="max_participants"
                  min={1}
                  defaultValue={session?.max_participants ?? Math.max(20, selectedCount)}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="grid gap-2 text-sm font-medium">
                Toplantı Tarihi *
                <input
                  type="date"
                  name="meeting_date"
                  required
                  defaultValue={defaults.date}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20"
                />
              </label>

              <label className="grid gap-2 text-sm font-medium">
                Başlangıç Saati *
                <input
                  type="time"
                  name="start_clock"
                  required
                  defaultValue={defaults.startClock}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20"
                />
              </label>

              <label className="grid gap-2 text-sm font-medium">
                Bitiş Saati *
                <input
                  type="time"
                  name="end_clock"
                  required
                  defaultValue={defaults.endClock}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20"
                />
              </label>
            </div>

            {showDepartment && (
              <label className="grid gap-2 text-sm font-medium">
                Bölüm
                <select
                  name="department_id"
                  defaultValue={session?.department_id ?? ""}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20"
                >
                  <option value="">Bölüm seçin</option>
                  {departmentOptions.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <section className="space-y-3 rounded-md border border-border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">Katılımcılar</p>
                  <p className="text-xs text-muted-foreground">{selectedCount} kişi seçildi</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant={allStaffSelected ? "secondary" : "outline"} size="sm" onClick={toggleAllStaff}>
                    {allStaffSelected ? <CheckSquare className="size-4" /> : <Square className="size-4" />}
                    Tüm personeli seç
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={clearSelection}>
                    Temizle
                  </Button>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-[1fr_220px]">
                <label className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Personel ara"
                    className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20"
                  />
                </label>
                <select
                  value={roleFilter}
                  onChange={(event) => setRoleFilter(event.target.value)}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20"
                >
                  <option value="all">Tüm roller</option>
                  {Array.from(new Set(participantOptions.map((participant) => participant.role))).map((role) => (
                    <option key={role} value={role}>
                      {participantRoleLabels[role] ?? role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="max-h-72 overflow-y-auto rounded-md border border-border">
                {filteredParticipants.length > 0 ? (
                  filteredParticipants.map((participant) => (
                    <label
                      key={participant.id}
                      className="flex cursor-pointer items-center gap-3 border-b border-border px-3 py-2 last:border-b-0 hover:bg-muted/40"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSet.has(participant.id)}
                        onChange={() => toggleParticipant(participant.id)}
                        className="size-4 rounded border-input"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{participant.full_name}</span>
                        <span className="block text-xs text-muted-foreground">{participantRoleLabels[participant.role] ?? participant.role}</span>
                      </span>
                    </label>
                  ))
                ) : (
                  <div className="px-3 py-6 text-center text-sm text-muted-foreground">Personel bulunamadı.</div>
                )}
              </div>
            </section>

            <label className="grid gap-2 text-sm font-medium">
              Notlar
              <textarea
                name="notes"
                rows={2}
                defaultValue={session?.notes ?? ""}
                placeholder="İç notlar (katılımcılar görmez)"
                className="rounded-md border border-input bg-background px-3 py-2 text-sm font-normal outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20"
              />
            </label>

            {state?.error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</div>}

            <div className="flex items-center gap-3">
              <FormSubmitButton pendingLabel={session ? "Güncelleniyor..." : "Oluşturuluyor..."}>
                {session ? "Güncelle" : "Oluştur"}
              </FormSubmitButton>
              <Link href={session ? `/canli-oturumlar/${session.id}` : "/canli-oturumlar"} className={cn(buttonVariants({ variant: "outline" }))}>
                İptal
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function getDefaultDateTimeParts(session?: LiveSessionRow) {
  const startDate = session?.start_time ? new Date(session.start_time) : roundToNextQuarterHour(new Date());
  const endDate = session?.end_time ? new Date(session.end_time) : new Date(startDate.getTime() + 60 * 60 * 1000);

  return {
    date: formatDateInput(startDate),
    startClock: formatTimeInput(startDate),
    endClock: formatTimeInput(endDate),
  };
}

function roundToNextQuarterHour(date: Date) {
  const next = new Date(date);
  next.setSeconds(0, 0);
  const minutes = next.getMinutes();
  const roundedMinutes = Math.ceil(minutes / 15) * 15;
  next.setMinutes(roundedMinutes);
  return next;
}

function formatDateInput(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatTimeInput(date: Date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}
