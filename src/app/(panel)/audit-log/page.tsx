import Link from "next/link";
import { notFound } from "next/navigation";
import { Filter, Search } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { NativeSelect } from "@/components/ui/native-select";
import { requireAuth } from "@/lib/auth";
import { auditActionOptions, auditActionLabels, auditEntityTypeLabels, auditEntityTypeOptions } from "@/lib/audit/constants";
import { getAuditLogsForProfile } from "@/lib/audit/queries";
import { roleLabels } from "@/lib/navigation";
import { cn } from "@/lib/utils";

type AuditLogPageProps = {
  searchParams: Promise<{
    q?: string;
    action?: string;
    entity_type?: string;
    from?: string;
    to?: string;
    actor?: string;
    student?: string;
  }>;
};

export default async function AuditLogPage({ searchParams }: AuditLogPageProps) {
  const params = await searchParams;
  const { profile } = await requireAuth();
  const logs = await getAuditLogsForProfile(profile, {
    search: params.q,
    action: params.action,
    entityType: params.entity_type,
    from: params.from,
    to: params.to,
    actor: params.actor,
    student: params.student,
  });

  if (!logs) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Audit Log"
        title="Audit Log"
        description="Kritik iÅŸlemler kronolojik olarak kaydedilir. BÃ¶lÃ¼m mÃ¼dÃ¼rleri ve hocalar yalnÄ±zca yetkili olduklarÄ± talebe kayÄ±tlarÄ±nÄ± gÃ¶rÃ¼r."
      />

      <Card>
        <CardContent className="space-y-4 pt-6">
          <form method="get" className="grid gap-3 lg:grid-cols-6">
            <label className="space-y-1 lg:col-span-2">
              <span className="text-xs font-medium text-muted-foreground">Arama</span>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input name="q" defaultValue={params.q} placeholder="BaÅŸlÄ±k, aÃ§Ä±klama, iÅŸlem yapan veya talebe adÄ±" className="pl-9" />
              </div>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Ä°ÅŸlem</span>
              <NativeSelect
                name="action"
                defaultValue={params.action ?? ""}
                className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm shadow-sm outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20"
              >
                {auditActionOptions.map((option) => (
                  <option key={option.value || "all"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </NativeSelect>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Entity type</span>
              <NativeSelect
                name="entity_type"
                defaultValue={params.entity_type ?? ""}
                className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm shadow-sm outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20"
              >
                {auditEntityTypeOptions.map((option) => (
                  <option key={option.value || "all"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </NativeSelect>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Ä°ÅŸlemi yapan</span>
              <Input name="actor" defaultValue={params.actor} placeholder="Ad soyad" />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Talebe</span>
              <Input name="student" defaultValue={params.student} placeholder="Talebe adÄ±" />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">BaÅŸlangÄ±Ã§</span>
              <Input name="from" type="date" defaultValue={params.from} />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">BitiÅŸ</span>
              <Input name="to" type="date" defaultValue={params.to} />
            </label>

            <div className="flex items-end gap-2 lg:col-span-2">
              <Button type="submit" className="bg-[#093657] text-white hover:bg-[#082b46]">
                <Filter className="size-4" aria-hidden="true" />
                Filtrele
              </Button>
              <Link href="/audit-log" className={cn(buttonVariants({ variant: "outline" }))}>
                Temizle
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tarih</TableHead>
                <TableHead>Ä°ÅŸlem</TableHead>
                <TableHead>BaÅŸlÄ±k</TableHead>
                <TableHead>Ä°ÅŸlemi yapan</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Ä°lgili talebe</TableHead>
                <TableHead>Entity type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length > 0 ? (
                logs.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{formatDateTime(entry.created_at)}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm font-medium text-[#093657]">{auditActionLabels[entry.action] ?? entry.action}</TableCell>
                    <TableCell className="max-w-[320px]">
                      <Link href={`/audit-log/${entry.id}`} className="line-clamp-2 font-medium text-foreground hover:text-[#093657]">
                        {entry.title}
                      </Link>
                      {entry.description ? <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{entry.description}</p> : null}
                    </TableCell>
                    <TableCell>{entry.actor_name}</TableCell>
                    <TableCell>{roleLabels[entry.actor_role as keyof typeof roleLabels] ?? entry.actor_role}</TableCell>
                    <TableCell>{entry.student?.full_name ?? "-"}</TableCell>
                    <TableCell>{auditEntityTypeLabels[entry.entity_type] ?? entry.entity_type}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                    KayÄ±t bulunamadÄ±.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
