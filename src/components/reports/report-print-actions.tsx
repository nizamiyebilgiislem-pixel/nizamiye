import Link from "next/link";

import { PdfPrintButton } from "@/components/reports/pdf-print-button";
import { cn } from "@/lib/utils";

type ReportPrintActionsProps = {
  backHref?: string;
};

export function ReportPrintActions({ backHref = "/raporlar" }: ReportPrintActionsProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
      <Link href={backHref} className={cn("text-sm font-medium text-[#093657] hover:underline")}>
        Raporlar&apos;a dön
      </Link>
      <PdfPrintButton />
    </div>
  );
}
