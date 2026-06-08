import type { CourseRow, DepartmentRow, ProfileRow } from "@/types/database";

export function CourseForm({
  action,
  departments,
  profile,
  course,
}: {
  action: (formData: FormData) => void | Promise<void>;
  departments: DepartmentRow[];
  profile: ProfileRow;
  course?: CourseRow;
}) {
  const fixedDepartmentId = profile.role === "bolum_muduru" ? profile.department_id ?? "" : course?.department_id;

  return (
    <form action={action} className="space-y-5">
      {course ? <input type="hidden" name="id" value={course.id} /> : null}
      <div className="grid gap-4 md:grid-cols-3">
        <label className="grid gap-2 text-sm font-medium">
          Bölüm
          <select
            name="department_id"
            defaultValue={fixedDepartmentId ?? ""}
            disabled={Boolean(fixedDepartmentId)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal disabled:opacity-60"
          >
            <option value="">Bölüm seçin</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>{department.name}</option>
            ))}
          </select>
          {fixedDepartmentId ? <input type="hidden" name="department_id" value={fixedDepartmentId} /> : null}
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Ders Adı
          <input name="name" required defaultValue={course?.name ?? ""} className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal" />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Durum
          <select name="is_active" defaultValue={String(course?.is_active ?? true)} className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal">
            <option value="true">Aktif</option>
            <option value="false">Pasif</option>
          </select>
        </label>
      </div>
      <div className="flex justify-end">
        <button type="submit" className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
          {course ? "Dersi Güncelle" : "Dersi Kaydet"}
        </button>
      </div>
    </form>
  );
}
