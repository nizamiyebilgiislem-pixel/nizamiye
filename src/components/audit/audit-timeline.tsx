import Link from "next/link";
import { ArrowRight, CalendarClock, UserRound } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { AuditLogEntry } from "@/lib/audit/queries";
import { auditActionLabels, auditEntityTypeLabels } from "@/lib/audit/constants";
import { cn } from "@/lib/utils";

type AuditTimelineProps = {
  entries: AuditLogEntry[];
  emptyText: string;
  detailBasePath?: string;
  className?: string;
};

export function AuditTimeline({ entries, emptyText, detailBasePath, className }: AuditTimelineProps) {
  if (entries.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">{emptyText}</CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {entries.map((entry) => {
        const actionLabel = auditActionLabels[entry.action] ?? entry.action;
        const entityLabel = auditEntityTypeLabels[entry.entity_type] ?? entry.entity_type;
        const href = detailBasePath ? `${detailBasePath}/${entry.id}` : null;

        return (
          <Card key={entry.id} size="sm" className="border-border/70">
            <CardContent className="py-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#eef4f8] px-2.5 py-1 font-medium text-[#093657]">
                      <CalendarClock className="size-3.5" aria-hidden="true" />
                      {formatDateTime(entry.created_at)}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#eef4f8] px-2.5 py-1 font-medium text-[#093657]">
                      <UserRound className="size-3.5" aria-hidden="true" />
                      {entry.actor_name}
                    </span>
                    <span className="rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                      {entry.actor_role}
                    </span>
                    <span className="rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                      {entityLabel}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-[#093657]">{actionLabel}</p>
                    <p className="text-sm text-foreground">{entry.title}</p>
                    {entry.description ? <p className="text-sm leading-6 text-muted-foreground">{entry.description}</p> : null}
                    {entry.student ? (
                      <p className="text-xs text-muted-foreground">
                        Talebe: <span className="font-medium text-foreground">{entry.student.full_name}</span>
                      </p>
                    ) : null}
                  </div>
                </div>
                {href ? (
                  <Link
                    href={href}
                    className="inline-flex items-center gap-1 self-start rounded-md border border-border bg-background px-3 py-2 text-xs font-medium text-[#093657] transition-colors hover:border-[#093657]/40 hover:bg-[#eef4f8]"
                  >
                    Detay
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Link>
                ) : null}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
