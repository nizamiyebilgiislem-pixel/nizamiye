import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type FilterField = {
  label: string;
  name: string;
  type: "text" | "date" | "select" | "search";
  defaultValue?: string;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
};

type ReportFilterPanelProps = {
  fields: FilterField[];
  baseHref: string;
};

export function ReportFilterPanel({ fields, baseHref }: ReportFilterPanelProps) {
  return (
    <Card size="sm">
      <CardContent className="p-4">
        <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {fields.map((field) => (
            <FilterField key={field.name} {...field} />
          ))}
          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="inline-flex h-10 items-center rounded-md bg-[#093657] px-4 text-sm font-medium text-white hover:bg-[#072943]"
            >
              Filtrele
            </button>
            <Link
              href={baseHref}
              className={cn(
                "inline-flex h-10 items-center rounded-md border border-[#093657]/15 bg-white px-4 text-sm font-medium text-[#093657]",
              )}
            >
              Temizle
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function FilterField(props: FilterField) {
  if (props.type === "select" && props.options) {
    return (
      <label className="space-y-1 text-sm">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">{props.label}</span>
        <select
          name={props.name}
          defaultValue={props.defaultValue ?? ""}
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          {props.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <label className="space-y-1 text-sm">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{props.label}</span>
      <input
        type={props.type}
        name={props.name}
        defaultValue={props.defaultValue}
        placeholder={props.placeholder}
        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
      />
    </label>
  );
}


