import Link from "next/link";
import { Eye } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ManagedAcademicTerm } from "@/lib/terms/management-queries";
import { cn } from "@/lib/utils";

export function AcademicTermsManagementTable({ terms }: { terms: ManagedAcademicTerm[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dönem Listesi</CardTitle>
        <CardDescription>Tüm akademik dönemler ve kapanış durumları.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dönem adı</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Başlangıç</TableHead>
              <TableHead>Bitiş</TableHead>
              <TableHead>Oluşturma</TableHead>
              <TableHead>Kapanış</TableHead>
              <TableHead>Kapatan</TableHead>
              <TableHead>Snapshot</TableHead>
              <TableHead>Closure run</TableHead>
              <TableHead>Aktif</TableHead>
              <TableHead>Güncel</TableHead>
              <TableHead className="text-right">İşlem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {terms.length > 0 ? (
              terms.map((term) => (
                <TableRow key={term.id}>
                  <TableCell className="font-medium text-[#093657]">{term.name}</TableCell>
                  <TableCell>
                    <StatusBadge status={term.status} />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDate(term.start_date)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDate(term.end_date)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDateTime(term.created_at)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDateTime(term.closed_at)}</TableCell>
                  <TableCell>{term.closedByProfile?.full_name ?? "-"}</TableCell>
                  <TableCell>{formatNumber(term.snapshotCount)}</TableCell>
                  <TableCell>
                    {term.latestClosureRun ? <ClosureRunBadge status={term.latestClosureRun.status} /> : "-"}
                  </TableCell>
                  <TableCell>{term.is_active ? "Evet" : "Hayır"}</TableCell>
                  <TableCell>{term.is_current ? "Evet" : "Hayır"}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/sistem/donem-yonetimi/${term.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                      <Eye className="size-3.5" aria-hidden="true" />
                      Detay
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={12} className="py-12 text-center text-sm text-muted-foreground">
                  Henüz dönem oluşturulmadı.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export function StatusBadge({ status }: { status: ManagedAcademicTerm["status"] }) {
  const labelMap: Record<ManagedAcademicTerm["status"], string> = {
    draft: "draft",
    active: "active",
    closed: "closed",
    archived: "archived",
  };
  const variant = status === "active" ? "default" : status === "closed" || status === "archived" ? "secondary" : "outline";

  return <Badge variant={variant}>{labelMap[status]}</Badge>;
}

function ClosureRunBadge({ status }: { status: NonNullable<ManagedAcademicTerm["latestClosureRun"]>["status"] }) {
  return <Badge variant={status === "failed" ? "destructive" : "outline"}>{status}</Badge>;
}

function formatDate(value: string | null) {
  return value ? new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(new Date(value)) : "-";
}

function formatDateTime(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("tr-TR", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "-";
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("tr-TR").format(value);
}
