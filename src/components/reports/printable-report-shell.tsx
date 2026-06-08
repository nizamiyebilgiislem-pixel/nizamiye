import Link from "next/link";
import type { ReactNode } from "react";

import { PdfPrintButton } from "@/components/reports/pdf-print-button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PrintableReportShellProps = {
  title: string;
  subtitle?: string;
  generatedAt?: Date;
  backHref: string;
  backLabel?: string;
  meta?: ReactNode;
  children: ReactNode;
};

export function PrintableReportShell({
  title,
  subtitle,
  generatedAt = new Date(),
  backHref,
  backLabel = "Geri Dön",
  meta,
  children,
}: PrintableReportShellProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href={backHref} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          {backLabel}
        </Link>
        <PdfPrintButton />
      </div>

      <article className="mx-auto max-w-[210mm] space-y-6 rounded-md border border-border bg-white p-6 shadow-sm print:max-w-none print:border-0 print:p-0 print:shadow-none">
        <header className="space-y-3 border-b border-border pb-4">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-[#093657]">Nizamiye Öğrenci Sistemi</p>
          <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold text-[#093657]">{title}</h1>
              {subtitle ? <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{subtitle}</p> : null}
            </div>
            <div className="text-sm text-muted-foreground">
              <p>{new Intl.DateTimeFormat("tr-TR", { dateStyle: "long", timeStyle: "short" }).format(generatedAt)}</p>
            </div>
          </div>
          {meta ? <div className="flex flex-wrap gap-2">{meta}</div> : null}
        </header>

        <div className="space-y-6">{children}</div>
      </article>
    </div>
  );
}
