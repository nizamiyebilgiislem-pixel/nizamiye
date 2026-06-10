import Link from "next/link";
import type { ComponentType } from "react";

import { Card, CardContent } from "@/components/ui/card";

type ReportCardProps = {
  title: string;
  description: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  badge: string;
  roles: string;
};

export function ReportCard({ title, description, href, icon: Icon, badge, roles }: ReportCardProps) {
  return (
    <Link href={href}>
      <Card className="h-full border-[#093657]/10 bg-white transition-colors hover:bg-[#f8fafc]">
        <CardContent className="flex h-full flex-col gap-3 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#eaf1f6]">
              <Icon className="size-5 text-[#093657]" aria-hidden />
            </div>
            <span className="shrink-0 rounded-full border border-[#093657]/15 bg-[#f8fafc] px-2.5 py-0.5 text-[11px] font-medium text-[#093657]">
              {badge}
            </span>
          </div>
          <div className="flex-1 space-y-1">
            <h3 className="text-sm font-semibold text-[#093657]">{title}</h3>
            <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
            <span className="text-[11px] text-muted-foreground">{roles}</span>
            <span className="text-xs font-medium text-[#093657] hover:underline">Raporu Aç</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function ReportCardSkeleton() {
  return (
    <Card className="h-full border-[#093657]/10 bg-white">
      <CardContent className="flex h-full flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="size-10 animate-pulse rounded-lg bg-muted" />
          <div className="h-4 w-16 animate-pulse rounded-full bg-muted" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-3 w-full animate-pulse rounded bg-muted" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
        </div>
        <div className="flex items-center justify-between border-t border-border pt-3">
          <div className="h-3 w-20 animate-pulse rounded bg-muted" />
          <div className="h-3 w-16 animate-pulse rounded bg-muted" />
        </div>
      </CardContent>
    </Card>
  );
}

export function PrintHeader() {
  return (
    <div className="print-only mb-6 hidden print:block">
      <div className="flex items-center gap-4 border-b border-[#093657] pb-4">
        <div>
          <h1 className="text-lg font-bold uppercase tracking-wider text-[#093657]">Nizamiye Medresesi</h1>
          <p className="text-xs text-muted-foreground">Nizamiye OYBS Rapor Sistemi</p>
        </div>
      </div>
    </div>
  );
}

export function PrintFooter({ pageInfo }: { pageInfo?: string }) {
  return (
    <div className="print-only mt-8 hidden border-t border-border pt-3 print:block">
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>Bu rapor Nizamiye OYBS üzerinden oluşturulmuştur.</span>
        {pageInfo ? <span>{pageInfo}</span> : null}
      </div>
    </div>
  );
}
