import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronDown } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth";
import { auditActionLabels, auditEntityTypeLabels } from "@/lib/audit/constants";
import { getAuditLogByIdForProfile } from "@/lib/audit/queries";
import { roleLabels } from "@/lib/navigation";
import { cn } from "@/lib/utils";

type AuditLogDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AuditLogDetailPage({ params }: AuditLogDetailPageProps) {
  const { id } = await params;
  const { profile } = await requireAuth();
  const log = await getAuditLogByIdForProfile(profile, id);

  if (!log) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader
          eyebrow="Audit Log"
          title={log.title}
          description={`${formatDateTime(log.created_at)} tarihinde kaydedildi.`}
        />
        <Link href="/audit-log" className={cn("inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-[#093657] hover:bg-[#eef4f8]")}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Audit Log
        </Link>
      </div>

      <Card>
        <CardContent className="grid gap-3 pt-6 md:grid-cols-2 xl:grid-cols-4">
          <Info label="İşlem" value={auditActionLabels[log.action] ?? log.action} />
          <Info label="Rol" value={roleLabels[log.actor_role as keyof typeof roleLabels] ?? log.actor_role} />
          <Info label="Entity type" value={auditEntityTypeLabels[log.entity_type] ?? log.entity_type} />
          <Info label="İşlemi yapan" value={log.actor_name} />
          <Info label="İlgili talebe" value={log.student?.full_name ?? "-"} />
          <Info label="Entity id" value={log.entity_id ?? "-"} />
          <Info label="Tarih" value={formatDateTime(log.created_at)} />
          <Info label="Actor profile id" value={log.actor_profile_id ?? "-"} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Açıklama</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm leading-6 text-muted-foreground">{log.description ?? "Açıklama girilmemiş."}</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        <JsonDetails title="Önceki veri" value={log.before_data} />
        <JsonDetails title="Sonraki veri" value={log.after_data} />
        <JsonDetails title="Metadata" value={log.metadata} />
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function JsonDetails({ title, value }: { title: string; value: unknown }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {title}
          <ChevronDown className="size-4 text-muted-foreground" aria-hidden="true" />
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <details className="group">
          <summary className="cursor-pointer list-none text-sm font-medium text-[#093657]">
            JSON görünümünü aç
          </summary>
          <pre className="mt-3 max-h-[420px] overflow-auto rounded-md border border-border bg-[#f8fafc] p-3 text-xs leading-6 text-foreground">
            {prettyJson(value)}
          </pre>
        </details>
      </CardContent>
    </Card>
  );
}

function prettyJson(value: unknown) {
  if (value === null || value === undefined) {
    return "null";
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
