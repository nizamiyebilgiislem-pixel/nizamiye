import { Filter, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ClassRow, DepartmentRow } from "@/types/database";

type StudentFiltersProps = {
  departments: DepartmentRow[];
  classes: ClassRow[];
  values: {
    search?: string;
    departmentId?: string;
    classId?: string;
  };
  actionPath: string;
};

export function StudentFilters({ departments, classes, values, actionPath }: StudentFiltersProps) {
  const filteredClasses = values.departmentId
    ? classes.filter((courseClass) => courseClass.department_id === values.departmentId)
    : classes;

  return (
    <Card>
      <CardContent className="p-4">
        <form action={actionPath} className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_220px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              defaultValue={values.search}
              placeholder="Ad soyad, TC kimlik veya veli telefonu"
              className="h-10 pl-9"
            />
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
            name="class"
            defaultValue={values.classId ?? ""}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Tüm sınıflar</option>
            {filteredClasses.map((courseClass) => (
              <option key={courseClass.id} value={courseClass.id}>
                {courseClass.name}
              </option>
            ))}
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
