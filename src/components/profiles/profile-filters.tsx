import { Filter, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { roleLabels } from "@/lib/route-permissions";
import type { DepartmentRow } from "@/types/database";
import type { UserRole } from "@/types/rbac";

type ProfileFiltersProps = {
  departments: DepartmentRow[];
  actionPath: string;
  values: {
    search?: string;
    role?: string;
    departmentId?: string;
    status?: string;
  };
  roleOptions: UserRole[];
};

export function ProfileFilters({ departments, actionPath, values, roleOptions }: ProfileFiltersProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <form action={actionPath} className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_190px_220px_170px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input name="q" defaultValue={values.search} placeholder="Ad soyad, e-posta veya telefon" className="h-10 pl-9" />
          </div>
          <select
            name="role"
            defaultValue={values.role ?? ""}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Tüm roller</option>
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {roleLabels[role]}
              </option>
            ))}
          </select>
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
