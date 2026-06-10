"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import type { ClassRow, DepartmentRow } from "@/types/database";

type GradeEntryFilterProps = {
  departments: DepartmentRow[];
  classes: ClassRow[];
  selectedDepartmentId: string;
  selectedClassId: string;
};

export function GradeEntryFilter({
  departments,
  classes,
  selectedDepartmentId,
  selectedClassId,
}: GradeEntryFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const filteredClasses = useMemo(
    () => classes.filter((c) => c.department_id === selectedDepartmentId),
    [classes, selectedDepartmentId],
  );

  const navigate = useCallback(
    (departmentId: string, classId: string) => {
      const params = new URLSearchParams(searchParams);
      params.set("department", departmentId);
      if (classId) params.set("class", classId);
      router.push(`/not-sistemi/not-girisi?${params.toString()}`);
    },
    [router, searchParams],
  );

  const handleDepartmentChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const deptId = e.target.value;
      const firstClass = classes
        .filter((c) => c.department_id === deptId)
        .sort((a, b) => a.name.localeCompare(b.name, "tr"))[0];
      navigate(deptId, firstClass?.id ?? "");
    },
    [classes, navigate],
  );

  const handleClassChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      navigate(selectedDepartmentId, e.target.value);
    },
    [navigate, selectedDepartmentId],
  );

  return (
    <div className="grid gap-3 md:grid-cols-[220px_220px_auto]">
      <select
        value={selectedDepartmentId}
        onChange={handleDepartmentChange}
        className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20"
      >
        {departments.map((department) => (
          <option key={department.id} value={department.id}>
            {department.name}
          </option>
        ))}
      </select>
      <select
        value={selectedClassId}
        onChange={handleClassChange}
        className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20"
      >
        {filteredClasses.length === 0 && (
          <option value="">Sınıf bulunamadı</option>
        )}
        {filteredClasses.map((classRow) => (
          <option key={classRow.id} value={classRow.id}>
            {classRow.name}
          </option>
        ))}
      </select>
    </div>
  );
}
