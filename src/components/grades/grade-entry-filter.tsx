"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import type { GradeEntryClassCourseOption } from "@/lib/grades/queries";
import type { ClassRow, DepartmentRow } from "@/types/database";

type GradeEntryFilterProps = {
  departments: DepartmentRow[];
  classes: ClassRow[];
  classCourses: GradeEntryClassCourseOption[];
  selectedDepartmentId: string;
  selectedClassId: string;
  selectedClassCourseId: string;
  selectedExamTypeId: string;
  lockDepartmentSelection?: boolean;
};

export function GradeEntryFilter({
  departments,
  classes,
  classCourses,
  selectedDepartmentId,
  selectedClassId,
  selectedClassCourseId,
  selectedExamTypeId,
  lockDepartmentSelection = false,
}: GradeEntryFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const filteredClasses = useMemo(
    () => classes.filter((classRow) => classRow.department_id === selectedDepartmentId),
    [classes, selectedDepartmentId],
  );
  const filteredCourses = useMemo(
    () => classCourses.filter((classCourse) => classCourse.class_id === selectedClassId),
    [classCourses, selectedClassId],
  );
  const filteredExamTypes = useMemo(() => {
    const selectedCourse = filteredCourses.find((classCourse) => classCourse.id === selectedClassCourseId);
    return selectedCourse?.examTypes ?? [];
  }, [filteredCourses, selectedClassCourseId]);
  const selectedDepartment = useMemo(
    () => departments.find((department) => department.id === selectedDepartmentId) ?? null,
    [departments, selectedDepartmentId],
  );
  const selectedClass = useMemo(
    () => classes.find((classRow) => classRow.id === selectedClassId) ?? null,
    [classes, selectedClassId],
  );
  const selectedCourse = useMemo(
    () => classCourses.find((classCourse) => classCourse.id === selectedClassCourseId) ?? null,
    [classCourses, selectedClassCourseId],
  );
  const selectedExamType = useMemo(
    () => filteredExamTypes.find((examType) => examType.id === selectedExamTypeId) ?? null,
    [filteredExamTypes, selectedExamTypeId],
  );

  const navigate = useCallback(
    (next: { departmentId?: string; classId?: string; classCourseId?: string; examTypeId?: string }) => {
      const params = new URLSearchParams(searchParams);

      if (next.departmentId) params.set("department", next.departmentId);
      else params.delete("department");

      if (next.classId) params.set("class", next.classId);
      else params.delete("class");

      if (next.classCourseId) params.set("course", next.classCourseId);
      else params.delete("course");

      if (next.examTypeId) params.set("exam", next.examTypeId);
      else params.delete("exam");

      params.delete("error");
      params.delete("success");

      const query = params.toString();
      router.push(query.length > 0 ? `/not-sistemi/not-girisi?${query}` : "/not-sistemi/not-girisi");
    },
    [router, searchParams],
  );

  const handleDepartmentChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      navigate({
        departmentId: event.target.value,
        classId: "",
        classCourseId: "",
        examTypeId: "",
      });
    },
    [navigate],
  );

  const handleClassChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      navigate({
        departmentId: selectedDepartmentId,
        classId: event.target.value,
        classCourseId: "",
        examTypeId: "",
      });
    },
    [navigate, selectedDepartmentId],
  );

  const handleCourseChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      navigate({
        departmentId: selectedDepartmentId,
        classId: selectedClassId,
        classCourseId: event.target.value,
        examTypeId: "",
      });
    },
    [navigate, selectedClassId, selectedDepartmentId],
  );

  const handleExamTypeChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      navigate({
        departmentId: selectedDepartmentId,
        classId: selectedClassId,
        classCourseId: selectedClassCourseId,
        examTypeId: event.target.value,
      });
    },
    [navigate, selectedClassCourseId, selectedClassId, selectedDepartmentId],
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="grid gap-2 text-sm">
          <span className="font-medium text-foreground">Bölüm</span>
          <select
            value={selectedDepartmentId}
            onChange={handleDepartmentChange}
            disabled={departments.length === 0 || lockDepartmentSelection}
            className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20 disabled:cursor-not-allowed disabled:bg-[#f3f6f9] disabled:text-muted-foreground"
          >
            <option value="">{departments.length === 0 ? "Bölüm bulunamadı" : "Bölüm seçiniz"}</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
          <span className="text-xs text-muted-foreground">
            {lockDepartmentSelection ? "Rolünüz gereği bölüm seçimi sabitlenmiştir." : "Sınav girişini bölüm bazında daraltın."}
          </span>
        </label>

        <label className="grid gap-2 text-sm">
          <span className="font-medium text-foreground">Sınıf</span>
          <select
            value={selectedClassId}
            onChange={handleClassChange}
            disabled={!selectedDepartmentId || filteredClasses.length === 0}
            className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20 disabled:cursor-not-allowed disabled:bg-[#f3f6f9] disabled:text-muted-foreground"
          >
            <option value="">
              {!selectedDepartmentId ? "Önce bölüm seçiniz." : filteredClasses.length === 0 ? "Sınıf bulunamadı" : "Sınıf seçiniz"}
            </option>
            {filteredClasses.map((classRow) => (
              <option key={classRow.id} value={classRow.id}>
                {classRow.name}
              </option>
            ))}
          </select>
          <span className="text-xs text-muted-foreground">
            {!selectedDepartmentId
              ? "Önce bölüm seçiniz."
              : filteredClasses.length === 0
                ? "Bu bölüme ait aktif sınıf bulunamadı."
                : "Seçilen bölüme ait aktif sınıflar listelenir."}
          </span>
        </label>

        <label className="grid gap-2 text-sm">
          <span className="font-medium text-foreground">Ders</span>
          <select
            value={selectedClassCourseId}
            onChange={handleCourseChange}
            disabled={!selectedClassId || filteredCourses.length === 0}
            className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20 disabled:cursor-not-allowed disabled:bg-[#f3f6f9] disabled:text-muted-foreground"
          >
            <option value="">
              {!selectedClassId ? "Önce sınıf seçiniz." : filteredCourses.length === 0 ? "Ders bulunamadı" : "Ders seçiniz"}
            </option>
            {filteredCourses.map((classCourse) => (
              <option key={classCourse.id} value={classCourse.id}>
                {classCourse.course?.name ?? "İsimsiz ders"}
              </option>
            ))}
          </select>
          <span className="text-xs text-muted-foreground">
            {!selectedClassId
              ? "Önce sınıf seçiniz."
              : filteredCourses.length === 0
                ? "Bu sınıfa atanmış aktif ders bulunamadı."
                : "Seçilen sınıfa atanmış aktif dersler listelenir."}
          </span>
        </label>

        <label className="grid gap-2 text-sm">
          <span className="font-medium text-foreground">Sınav Türü</span>
          <select
            value={selectedExamTypeId}
            onChange={handleExamTypeChange}
            disabled={!selectedClassCourseId || filteredExamTypes.length === 0}
            className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20 disabled:cursor-not-allowed disabled:bg-[#f3f6f9] disabled:text-muted-foreground"
          >
            <option value="">
              {!selectedClassCourseId ? "Önce ders seçiniz." : filteredExamTypes.length === 0 ? "Sınav türü bulunamadı" : "Sınav türü seçiniz"}
            </option>
            {filteredExamTypes.map((examType) => (
              <option key={examType.id} value={examType.id}>
                {examType.name}
              </option>
            ))}
          </select>
          <span className="text-xs text-muted-foreground">
            {!selectedClassCourseId
              ? "Önce ders seçiniz."
              : filteredExamTypes.length === 0
                ? "Bu derse ait aktif sınav türü bulunamadı."
                : "Ders seçildikten sonra sınav türünü belirleyin."}
          </span>
        </label>
      </div>

      <div className="rounded-lg border border-border bg-[#f8fafc] px-4 py-3 text-sm text-[#093657]">
        <span className="font-medium">Seçilen:</span>{" "}
        {selectedDepartment?.name ?? "-"} / {selectedClass?.name ?? "-"} / {selectedCourse?.course?.name ?? "-"} / {selectedExamType?.name ?? "-"}
      </div>
    </div>
  );
}
