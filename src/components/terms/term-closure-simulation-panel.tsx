"use client";

import { useActionState, useEffect, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { AlertTriangle, Ban, CalendarDays, CheckCircle2, Play, ShieldAlert, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/toast/toast-provider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { runTermClosureAction, runTermClosureSimulationAction } from "@/lib/terms/closure-actions";
import type { TermClosureRunHistoryItem } from "@/lib/terms/closure-queries";
import type { TermClosureActionState } from "@/lib/terms/closure-actions";
import type { AcademicTermRow, TermClosureRunStatus, TermSimulationResult } from "@/types/database";

type TermClosureSimulationPanelProps = {
  activeTerm: AcademicTermRow | null;
  runHistory: TermClosureRunHistoryItem[];
  initialSimulationResult: TermSimulationResult | null;
};

const statusLabels: Record<TermClosureRunStatus, string> = {
  pending: "Bekliyor",
  running: "Çalışıyor",
  completed: "Tamamlandı",
  failed: "Başarısız",
};

const closureInitialState: TermClosureActionState = {
  success: false,
  error: "",
};

function subscribeToClientSnapshot() {
  return () => {};
}

export function TermClosureSimulationPanel({
  activeTerm,
  runHistory,
  initialSimulationResult,
}: TermClosureSimulationPanelProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [simulationResult, setSimulationResult] = useState<TermSimulationResult | null>(initialSimulationResult);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [closureState, closureAction] = useActionState(runTermClosureAction, closureInitialState);
  const lastSuccessMessageRef = useRef<string | null>(null);

  useEffect(() => {
    if (closureState.success && lastSuccessMessageRef.current !== closureState.message) {
      lastSuccessMessageRef.current = closureState.message;
      setIsCloseModalOpen(false);
      addToast("success", "Dönem kapatıldı", closureState.message);
      router.refresh();
    }
  }, [addToast, closureState, router]);

  function runSimulation() {
    setErrorMessage(null);
    startTransition(async () => {
      const response = await runTermClosureSimulationAction();

      if (!response.success) {
        setSimulationResult(null);
        setErrorMessage(response.error);
        return;
      }

      setSimulationResult(response.result);
    });
  }

  const canShowClosureAction = Boolean(activeTerm && simulationResult && simulationResult.blockers.length === 0);

  return (
    <div className="space-y-6">
      <Card className="border-[#f0c36a] bg-[#fff8e6]">
        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-start">
          <ShieldAlert className="mt-0.5 size-5 shrink-0 text-[#a15c07]" aria-hidden="true" />
          <div className="space-y-1">
            <p className="font-medium text-[#7a4304]">
              Bu ekran dönem sonlandırma simülasyonu ve kapatma ön izlemesi içindir. Bu aşamada hiçbir veri değiştirilmez.
            </p>
            <p className="text-sm text-[#8a5a13]">Gerçek dönem kapatma sonraki aşamada güvenli onay adımıyla çalıştırılır.</p>
          </div>
        </CardContent>
      </Card>

      <ActiveTermCard activeTerm={activeTerm} />

      {activeTerm ? (
        <Card>
          <CardHeader>
            <CardTitle>Simülasyon</CardTitle>
            <CardDescription>
              Aktif dönem için dönem sonu ön kontrolünü çalıştırır. Bu işlem kayıt oluşturmaz ve veri değiştirmez.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              Sonuçlar uyarı, engel ve modül bazlı kayıt sayıları olarak aşağıda listelenir.
            </div>
            <Button type="button" onClick={runSimulation} disabled={isPending} className="bg-[#093657] text-white hover:bg-[#082b46]">
              <Play className="size-4" aria-hidden="true" />
              {isPending ? "Simülasyon çalışıyor..." : "Simülasyon Çalıştır"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Sonlandırılabilecek aktif dönem bulunamadı.
          </CardContent>
        </Card>
      )}

      {errorMessage ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-start gap-3 pt-6 text-sm text-destructive">
            <Ban className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>{errorMessage}</span>
          </CardContent>
        </Card>
      ) : null}

      {simulationResult ? <SimulationResult result={simulationResult} /> : null}

      {canShowClosureAction ? (
        <Card className="border-[#0f766e]/25 bg-[#f0fdf4]">
          <CardHeader>
            <CardTitle>Dönemi Kapat</CardTitle>
            <CardDescription>
              Onay adımını tamamladıktan sonra snapshot oluşturulur, dönem kapatılır ve salt okunur hale getirilir.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-[#166534]">
              Gerçek dönem kapatma için kapatma onay penceresini açabilirsiniz.
            </div>
            <Button type="button" className="bg-[#0f766e] text-white hover:bg-[#0b5f58]" onClick={() => setIsCloseModalOpen(true)}>
              Dönemi Kapat
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-dashed">
        <CardContent className="flex items-center gap-3 pt-6 text-sm text-muted-foreground">
          <CheckCircle2 className="size-4 text-[#0f766e]" aria-hidden="true" />
          <span>Gerçek dönem kapatma sadece aktif dönem ve engelsiz simülasyon sonucunda açılır.</span>
        </CardContent>
      </Card>

      <RunHistoryTable runHistory={runHistory} />

      {isCloseModalOpen && !closureState.success ? (
        <CloseConfirmationModal
          termId={activeTerm?.id ?? ""}
          termName={activeTerm?.name ?? ""}
          onClose={() => setIsCloseModalOpen(false)}
          action={closureAction}
          state={closureState}
        />
      ) : null}
    </div>
  );
}

function ActiveTermCard({ activeTerm }: { activeTerm: AcademicTermRow | null }) {
  const mounted = useSyncExternalStore(subscribeToClientSnapshot, () => true, () => false);

  if (!activeTerm) {
    return null;
  }

  const elapsed = mounted ? getElapsedDescription(activeTerm.start_date, activeTerm.end_date) : "-";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aktif Dönem</CardTitle>
        <CardDescription>Simülasyon ve kapanış işlemleri bu dönem üzerinden çalıştırılır.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <InfoTile label="Dönem adı" value={activeTerm.name} />
        <InfoTile label="Başlangıç" value={formatDate(activeTerm.start_date)} />
        <InfoTile label="Bitiş" value={formatDate(activeTerm.end_date)} />
        <InfoTile label="Durum" value={activeTerm.status} />
        <InfoTile label="Geçen süre" value={elapsed} />
        <InfoTile label="Aktif mi?" value={activeTerm.is_active ? "Evet" : "Hayır"} />
        <InfoTile label="Güncel dönem mi?" value={activeTerm.is_current ? "Evet" : "Hayır"} />
      </CardContent>
    </Card>
  );
}

function SimulationResult({ result }: { result: TermSimulationResult }) {
  const sections = [
    {
      title: "Genel Özet",
      description: "Dönem kapsamındaki ana varlıklar.",
      items: [
        ["Aktif öğrenci", result.activeStudentCount],
        ["Bölüm", result.departmentCount],
        ["Sınıf", result.classCount],
      ],
    },
    {
      title: "Akademik Veriler",
      description: "Not ve kanaat kayıtlarının dönem kapsamı.",
      items: [
        ["Not kaydı", result.gradeCount],
        ["Kanaat kaydı", result.evaluationCount],
      ],
    },
    {
      title: "Yoklama",
      description: "Dönem tarih aralığındaki yoklama kapsamı.",
      items: [
        ["Oturum", result.attendanceSessionCount],
        ["Kayıt", result.attendanceRecordCount],
      ],
    },
    {
      title: "Sağlık/Revir",
      description: "Dönem içindeki revir kayıtları.",
      items: [["Revir kaydı", result.infirmaryRecordCount]],
    },
    {
      title: "Rehberlik",
      description: "Görüşme, takip, anket ve etkinlik toplamı.",
      items: [["Rehberlik kaydı", result.guidanceRecordCount]],
    },
    {
      title: "Yatakhane",
      description: "Aktif yatakhane atamaları.",
      items: [["Aktif atama", result.activeDormitoryAssignmentCount]],
    },
    {
      title: "Kütüphane",
      description: "Açık emanetler yeni dönem kararına ihtiyaç duyabilir.",
      items: [["Açık emanet", result.openLibraryLoanCount]],
    },
    {
      title: "Görevler ve Talepler",
      description: "Açık operasyonel işler.",
      items: [
        ["Açık görev", result.openTaskCount],
        ["Açık talep", result.openTalepCount],
      ],
    },
    {
      title: "Canlı Oturumlar",
      description: "Planlı veya aktif oturumlar.",
      items: [["Planlı/aktif oturum", result.plannedLiveSessionCount]],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sections.map((section) => (
          <Card key={section.title} size="sm">
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {section.items.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-3 rounded-md border border-border bg-[#f8fafc] px-3 py-2">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <span className="text-base font-semibold text-[#093657]">{formatNumber(value)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <MessageList
          title="Uyarılar"
          description="Kapatma öncesi yönetici kararı gerektirebilecek başlıklar."
          messages={result.warnings}
          emptyMessage="Uyarı bulunmuyor."
          tone="warning"
        />
        <MessageList
          title="Engeller"
          description="Gerçek dönem kapatma bu engeller giderilmeden yapılamaz."
          messages={result.blockers}
          emptyMessage="Engel bulunmuyor."
          tone="blocker"
        />
      </div>
    </div>
  );
}

function MessageList({
  title,
  description,
  messages,
  emptyMessage,
  tone,
}: {
  title: string;
  description: string;
  messages: string[];
  emptyMessage: string;
  tone: "warning" | "blocker";
}) {
  const isWarning = tone === "warning";

  return (
    <Card className={isWarning ? "border-[#f0c36a]" : "border-destructive/30"}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {messages.length > 0 ? (
          messages.map((message) => (
            <div
              key={message}
              className={
                isWarning
                  ? "flex items-start gap-2 rounded-md border border-[#f0c36a] bg-[#fff8e6] p-3 text-sm text-[#7a4304]"
                  : "flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
              }
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>{message}</span>
            </div>
          ))
        ) : (
          <div className="rounded-md border border-border bg-[#f8fafc] p-3 text-sm text-muted-foreground">{emptyMessage}</div>
        )}
      </CardContent>
    </Card>
  );
}

function RunHistoryTable({ runHistory }: { runHistory: TermClosureRunHistoryItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dönem Kapanış Denemeleri</CardTitle>
        <CardDescription>Son operasyon kayıtları yalnızca görüntüleme amaçlı listelenir.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tarih</TableHead>
              <TableHead>Dönem</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Başlatan</TableHead>
              <TableHead>Başlangıç</TableHead>
              <TableHead>Bitiş</TableHead>
              <TableHead>Hata</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {runHistory.length > 0 ? (
              runHistory.map((run) => (
                <TableRow key={run.id}>
                  <TableCell className="text-xs text-muted-foreground">{formatDateTime(run.created_at)}</TableCell>
                  <TableCell>{run.term?.name ?? "-"}</TableCell>
                  <TableCell>
                    <Badge variant={run.status === "failed" ? "destructive" : "default"}>{statusLabels[run.status]}</Badge>
                  </TableCell>
                  <TableCell>{run.startedByProfile?.full_name ?? "-"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDateTime(run.started_at)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDateTime(run.completed_at ?? run.failed_at)}</TableCell>
                  <TableCell className="max-w-[280px] whitespace-normal text-xs text-muted-foreground">
                    {run.error_message ?? "-"}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                  Dönem kapanış denemesi bulunmuyor.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function CloseConfirmationModal({
  termId,
  termName,
  onClose,
  action,
  state,
}: {
  termId: string;
  termName: string;
  onClose: () => void;
  action: (payload: FormData) => void;
  state: TermClosureActionState;
}) {
  const [acknowledged, setAcknowledged] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 backdrop-blur-sm">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="border-b">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Dönem Kapatma Onayı</CardTitle>
              <CardDescription>{termName} dönemi için geri alınamaz işlem onayı alınır.</CardDescription>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Kapat">
              <X className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <p className="text-sm text-muted-foreground">
            Bu işlem geri alınamaz. Snapshot oluşturacak, dönemi kapatacak ve salt okunur hale getirecektir.
          </p>

          <form action={action} className="space-y-4">
            <input type="hidden" name="term_id" value={termId} />

            <label className="flex items-start gap-3 rounded-md border border-border bg-[#f8fafc] p-3 text-sm">
              <input
                type="checkbox"
                name="confirmation_ack"
                checked={acknowledged}
                onChange={(event) => setAcknowledged(event.target.checked)}
                className="mt-1 size-4 rounded border-border"
              />
              <span>Bu işlemin geri alınamaz olduğunu anladım.</span>
            </label>

            <label className="space-y-1.5 block">
              <span className="text-xs font-medium text-muted-foreground">Onay metni</span>
              <input
                name="confirmation_text"
                value={confirmationText}
                onChange={(event) => setConfirmationText(event.target.value)}
                placeholder="DÖNEMİ KAPAT"
                className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm shadow-sm outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/20"
              />
            </label>

            {!state.success && state.error ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                {state.error}
              </div>
            ) : null}

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={onClose}>
                İptal
              </Button>
              <SubmitButton disabled={!acknowledged || confirmationText !== "DÖNEMİ KAPAT"} />
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={disabled || pending} className="bg-[#0f766e] text-white hover:bg-[#0b5f58]">
      {pending ? "Kapatılıyor..." : "Dönemi Kapat"}
    </Button>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-[#f8fafc] p-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 flex min-h-6 items-center gap-2 text-sm font-semibold text-[#093657]">
        {label === "Geçen süre" ? <CalendarDays className="size-4 text-[#47758f]" aria-hidden="true" /> : null}
        {value}
      </p>
    </div>
  );
}

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeZone: "Europe/Istanbul" }).format(new Date(value));
}

function formatDateTime(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

function formatNumber(value: string | number) {
  if (typeof value === "string") return value;
  return new Intl.NumberFormat("tr-TR").format(value);
}

function getElapsedDescription(startDate: string | null, endDate: string | null) {
  if (!startDate) return "-";

  const start = new Date(startDate).getTime();
  const now = Date.now();
  const diffDays = Math.max(0, Math.floor((now - start) / 86_400_000));

  if (!endDate) {
    return `${diffDays} gün`;
  }

  const end = new Date(endDate).getTime();
  const totalDays = Math.max(1, Math.ceil((end - start) / 86_400_000));
  const percent = Math.min(100, Math.round((diffDays / totalDays) * 100));

  return `${diffDays} gün · %${percent}`;
}
