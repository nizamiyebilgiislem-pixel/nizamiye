import Link from "next/link";
import { FileText } from "lucide-react";

type QuickActionButtonProps = {
  href: string;
  label: string;
};

export function QuickActionButton({ href, label }: QuickActionButtonProps) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-md border border-[#093657]/20 bg-white px-3 py-2 text-xs font-medium text-[#093657] transition-colors hover:bg-[#eaf1f6]"
    >
      <FileText className="size-3.5" aria-hidden />
      {label}
    </Link>
  );
}
