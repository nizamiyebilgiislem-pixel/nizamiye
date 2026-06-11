import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  basePath: string;
  searchParams?: Record<string, string>;
};

export function Pagination({ currentPage, totalPages, basePath, searchParams }: PaginationProps) {
  if (totalPages <= 1) return null;

  const buildHref = (page: number) => {
    const params = new URLSearchParams(searchParams ?? {});
    if (page > 1) {
      params.set("page", String(page));
    } else {
      params.delete("page");
    }
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  return (
    <div className="flex items-center justify-center gap-2 py-4">
      {currentPage > 1 ? (
        <Link
          href={buildHref(currentPage - 1)}
          className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-[#f8fafc]"
        >
          <ChevronLeft className="size-4" />
          Önceki
        </Link>
      ) : (
        <span className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground opacity-50">
          <ChevronLeft className="size-4" />
          Önceki
        </span>
      )}

      <div className="flex items-center gap-1">
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((page) => {
            if (totalPages <= 7) return true;
            if (page === 1 || page === totalPages) return true;
            if (Math.abs(page - currentPage) <= 1) return true;
            return false;
          })
          .map((page, index, arr) => (
            <span key={page} className="flex items-center">
              {index > 0 && arr[index - 1] !== page - 1 && (
                <span className="px-1 text-muted-foreground">...</span>
              )}
              {page === currentPage ? (
                <span className="inline-flex size-8 items-center justify-center rounded-md bg-[#093657] text-sm font-medium text-white">
                  {page}
                </span>
              ) : (
                <Link
                  href={buildHref(page)}
                  className="inline-flex size-8 items-center justify-center rounded-md text-sm text-muted-foreground hover:bg-[#f8fafc]"
                >
                  {page}
                </Link>
              )}
            </span>
          ))}
      </div>

      {currentPage < totalPages ? (
        <Link
          href={buildHref(currentPage + 1)}
          className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-[#f8fafc]"
        >
          Sonraki
          <ChevronRight className="size-4" />
        </Link>
      ) : (
        <span className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground opacity-50">
          Sonraki
          <ChevronRight className="size-4" />
        </span>
      )}
    </div>
  );
}
