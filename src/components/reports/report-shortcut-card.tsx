import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ReportShortcutCardProps = {
  title: string;
  description: string;
  href: string;
  badge?: ReactNode;
  className?: string;
};

export function ReportShortcutCard({ title, description, href, badge, className }: ReportShortcutCardProps) {
  return (
    <Card className={cn("bg-white", className)}>
      <CardContent className="flex h-full flex-col justify-between gap-4 p-4">
        <div className="space-y-2">
          {badge ? <div className="text-[#093657]">{badge}</div> : null}
          <div>
            <h3 className="text-base font-semibold text-[#093657]">{title}</h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
          </div>
        </div>
        <Link href={href} className="inline-flex items-center gap-2 text-sm font-medium text-[#093657] hover:underline">
          Aç
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </CardContent>
    </Card>
  );
}
