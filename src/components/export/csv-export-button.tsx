"use client";

import { Download } from "lucide-react";

type CsvExportButtonProps = {
  data: Record<string, string | number | null | undefined>[];
  filename: string;
  label?: string;
};

export function CsvExportButton({ data, filename, label = "CSV'ye Aktar" }: CsvExportButtonProps) {
  function handleExport() {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map((row) => headers.map((h) => {
        const val = row[h];
        if (val === null || val === undefined) return "";
        const str = String(val);
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(",")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-[#f8fafc]"
    >
      <Download className="size-3.5" />
      {label}
    </button>
  );
}
