import { Filter, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { DepartmentRow } from "@/types/database";

type ClassFiltersProps = {
  departments: DepartmentRow[];
  values: {
    search?: string;
    departmentId?: string;
    status?: string;
  };
};

export function ClassFilters({ departments, values }: ClassFiltersProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <form action="/siniflar" className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_180px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input name="q" defaultValue={values.search} placeholder="Sınıf adı veya hoca adı" className="h-10 pl-9" />
          </div>
          <select
            name="department"
            defaultValue={values.departmentId ?? ""}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Tüm bölümler</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
          <select
            name="status"
            defaultValue={values.status ?? ""}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Tüm durumlar</option>
            <option value="active">Aktif</option>
            <option value="passive">Pasif</option>
          </select>
          <Button type="submit" className="h-10">
            <Filter className="size-4" aria-hidden="true" />
            Filtrele
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
