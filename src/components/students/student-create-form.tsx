import { createStudentAction } from "@/lib/students/actions";
import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { PhotoUploadField } from "@/components/forms/photo-upload-field";
import type { ClassRow, DepartmentRow, ProfileRow } from "@/types/database";

type StudentCreateFormProps = {
  departments: DepartmentRow[];
  classes: ClassRow[];
  profile: ProfileRow;
};

export function StudentCreateForm({ departments, classes, profile }: StudentCreateFormProps) {
  const visibleDepartments =
    profile.role === "bolum_muduru" ? departments.filter((department) => department.id === profile.department_id) : departments;
  const visibleClasses =
    profile.role === "bolum_muduru" ? classes.filter((courseClass) => courseClass.department_id === profile.department_id) : classes;

  return (
    <form action={createStudentAction} className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Talebe Adı Soyadı" name="full_name" required />
        <Field label="TC Kimlik" name="identity_number" />
        <SelectField label="Bölüm" name="department_id" required>
          <option value="">Bölüm seçin</option>
          {visibleDepartments.map((department) => (
            <option key={department.id} value={department.id}>
              {department.name}
            </option>
          ))}
        </SelectField>
        <SelectField label="Kurs Sınıfı" name="course_class_id" required>
          <option value="">Kurs sınıfı seçin</option>
          {visibleClasses.map((courseClass) => (
            <option key={courseClass.id} value={courseClass.id}>
              {courseClass.name}
            </option>
          ))}
        </SelectField>
        <Field label="Veli Telefonu" name="guardian_phone" />
        <Field label="Okul Sınıfı" name="school_class" />
        <Field label="Okulu" name="school_name" />
        <div className="md:col-span-2">
          <PhotoUploadField label="Talebe Fotoğrafı" name="photo" />
        </div>
      </div>
      <div className="flex justify-end">
        <FormSubmitButton pendingLabel="Kaydediliyor...">Talebeyi Kaydet</FormSubmitButton>
      </div>
    </form>
  );
}

function Field({ label, name, required }: { label: string; name: string; required?: boolean }) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <input
        name={name}
        required={required}
        className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-ring"
      />
    </label>
  );
}

function SelectField({
  label,
  name,
  required,
  children,
}: {
  label: string;
  name: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <select
        name={name}
        required={required}
        className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-ring"
      >
        {children}
      </select>
    </label>
  );
}
