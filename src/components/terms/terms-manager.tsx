import Link from "next/link";
import { CalendarClock, CheckCircle2, Plus } from "lucide-react";

import { upsertTermAction, setCurrentTermAction } from "@/lib/terms/actions";
import type { AcademicTermRow } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function TermsManager({ terms, canManage }: { terms: AcademicTermRow[]; canManage: boolean }) {
  return (
    <div className="space-y-4">
      {canManage ? <TermForm /> : null}
      <div className="grid gap-4">
        {terms.map((term) => (
          <Card key={term.id}>
            <CardHeader className="flex-row items-start justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="flex flex-wrap items-center gap-2">
                  {term.name}
                  <TermBadges term={term} />
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {formatDateRange(term.start_date, term.end_date)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/not-sistemi/donemler/${term.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                  Detay
                </Link>
                {canManage ? (
                  <>
                    <form action={setCurrentTermAction}>
                      <input type="hidden" name="id" value={term.id} />
                      <Button type="submit" variant="secondary" size="sm" disabled={term.is_current || term.status === "closed" || term.status === "archived"}>
                        <CheckCircle2 className="size-4" aria-hidden="true" />
                        Aktif Yap
                      </Button>
                    </form>
                    <Link href={`/not-sistemi/donemler/${term.id}/kapat`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                      Kapat
                    </Link>
                  </>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
              <form action={upsertTermAction} className="grid gap-3 md:grid-cols-[1fr_170px_170px_150px_150px_auto]">
                <input type="hidden" name="id" value={term.id} />
                <input name="name" defaultValue={term.name} disabled={!canManage} className="h-10 rounded-md border border-input bg-background px-3 text-sm disabled:opacity-60" />
                <input name="start_date" type="date" defaultValue={term.start_date ?? ""} disabled={!canManage} className="h-10 rounded-md border border-input bg-background px-3 text-sm disabled:opacity-60" />
                <input name="end_date" type="date" defaultValue={term.end_date ?? ""} disabled={!canManage} className="h-10 rounded-md border border-input bg-background px-3 text-sm disabled:opacity-60" />
                <select name="status" defaultValue={term.status} disabled={!canManage} className="h-10 rounded-md border border-input bg-background px-3 text-sm disabled:opacity-60">
                  <option value="draft">Taslak</option>
                  <option value="active">Aktif</option>
                  <option value="closed">Kapalı</option>
                  <option value="archived">Arşiv</option>
                </select>
                <label className="inline-flex h-10 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm disabled:opacity-60">
                  <input type="checkbox" name="is_current" defaultChecked={term.is_current} disabled={!canManage || term.status !== "active"} />
                  Current
                </label>
                {canManage ? (
                  <button type="submit" className={cn(buttonVariants({ size: "sm" }), "h-10 px-4")}>
                    Kaydet
                  </button>
                ) : null}
              </form>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function TermForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="size-4" aria-hidden="true" />
          Yeni Dönem
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={upsertTermAction} className="grid gap-3 md:grid-cols-[1fr_170px_170px_150px_150px_auto]">
          <input name="name" placeholder="Dönem adı" className="h-10 rounded-md border border-input bg-background px-3 text-sm" />
          <input name="start_date" type="date" className="h-10 rounded-md border border-input bg-background px-3 text-sm" />
          <input name="end_date" type="date" className="h-10 rounded-md border border-input bg-background px-3 text-sm" />
          <select name="status" defaultValue="draft" className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="draft">Taslak</option>
            <option value="active">Aktif</option>
            <option value="closed">Kapalı</option>
            <option value="archived">Arşiv</option>
          </select>
          <label className="inline-flex h-10 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm">
            <input type="checkbox" name="is_current" />
            Current
          </label>
          <button type="submit" className={cn(buttonVariants({ size: "sm" }), "h-10 px-4")}>
            Ekle
          </button>
        </form>
      </CardContent>
    </Card>
  );
}

function TermBadges({ term }: { term: AcademicTermRow }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant={term.status === "active" ? "default" : "secondary"}>{termStatusLabel(term.status)}</Badge>
      {term.is_current ? <Badge variant="outline">Current</Badge> : null}
      {term.closed_at ? (
        <Badge variant="outline" className="gap-1">
          <CalendarClock className="size-3.5" aria-hidden="true" />
          {formatDate(term.closed_at)}
        </Badge>
      ) : null}
    </div>
  );
}

function termStatusLabel(status: AcademicTermRow["status"]) {
  const labels: Record<AcademicTermRow["status"], string> = {
    draft: "Taslak",
    active: "Aktif",
    closed: "Kapalı",
    archived: "Arşiv",
  };

  return labels[status];
}

function formatDateRange(startDate: string | null, endDate: string | null) {
  const start = startDate ? formatDate(startDate) : "Başlangıç yok";
  const end = endDate ? formatDate(endDate) : "Bitiş yok";
  return `${start} - ${end}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(new Date(value));
}
