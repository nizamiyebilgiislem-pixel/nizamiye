import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { PhotoUploadField } from "@/components/forms/photo-upload-field";
import { updateStudentAction } from "@/lib/students/actions";
import { studentStatusLabels } from "@/lib/students/constants";
import type { StudentWithRelations } from "@/lib/students/queries";
import type { ClassRow, ProfileRow } from "@/types/database";
import { studentStatuses } from "@/types/rbac";

type StudentEditFormProps = {
  student: StudentWithRelations;
  classes: ClassRow[];
  profile: ProfileRow;
};

export function StudentEditForm({ student, classes, profile }: StudentEditFormProps) {
  const visibleClasses =
    profile.role === "bolum_muduru" || profile.role === "hoca"
      ? classes.filter((courseClass) => courseClass.department_id === profile.department_id)
      : classes;
  const canChangeStatus = profile.role !== "hoca";

  return (
    <form action={updateStudentAction} className="space-y-6">
      <input type="hidden" name="id" value={student.id} />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Field label="Talebe Adı ve Soyadı" name="full_name" value={student.full_name} required />
        <Field label="Talebe Kimlik Numarası" name="identity_number" value={student.identity_number} />
        <Field label="Talebe Babasının Adı" name="father_name" value={student.father_name} />
        <Field label="Talebe Annesinin Adı" name="mother_name" value={student.mother_name} />
        <Field label="Talebe Velisinin Numarası" name="guardian_phone" value={student.guardian_phone} />
        <Field label="Talebe Velisinin İkinci Numarası" name="guardian_phone_2" value={student.guardian_phone_2} />
        <Field label="Talebe Baba Meslek" name="father_job" value={student.father_job} />
        <Field label="Talebe Anne Meslek" name="mother_job" value={student.mother_job} />
        <Field label="Talebe Baba Durum" name="father_status" value={student.father_status} />
        <Field label="Talebe Anne Durum" name="mother_status" value={student.mother_status} />
        <Field label="Talebe Aile Aylık Ortalama Gelir" name="family_monthly_income" value={student.family_monthly_income} />
        <Field label="Talebe Ev Durumu" name="home_status" value={student.home_status} />
        <Field label="Talebe Baba Anne Durumu" name="parent_marital_status" value={student.parent_marital_status} />
        <Field label="Talebe Kan Grubu" name="blood_type" value={student.blood_type} />
        <Field
          label="Talebe Eğitim Kurumunda Okuyan Kardeş"
          name="sibling_in_institution"
          value={student.sibling_in_institution}
        />
        <Field label="Doğum Tarihi" name="birth_date" type="date" value={student.birth_date} />
        <Field label="Kayıt Tarihi" name="registration_date" type="date" value={student.registration_date} />
        <label className="grid gap-2 text-sm font-medium">
          Talebe Kurs Sınıfı
          <select
            name="course_class_id"
            required
            defaultValue={student.course_class_id ?? ""}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-ring"
          >
            <option value="">Kurs sınıfı seçin</option>
            {visibleClasses.map((courseClass) => (
              <option key={courseClass.id} value={courseClass.id}>
                {courseClass.name}
              </option>
            ))}
          </select>
        </label>
        <Field label="Talebe Okul Sınıfı" name="school_class" value={student.school_class} />
        <Field label="Talebe Okulu" name="school_name" value={student.school_name} />
        <Field label="Talebe Uyruğu" name="nationality" value={student.nationality} />
        <Field label="Talebenin Memleketi" name="hometown" value={student.hometown} />
        <div className="md:col-span-2 xl:col-span-3">
          <PhotoUploadField label="Talebe Fotoğrafı" name="photo" displayName={student.full_name} initialPhotoUrl={student.photo_url} />
        </div>
        <label className="grid gap-2 text-sm font-medium">
          Durum
          <select
            name="status"
            defaultValue={student.status}
            disabled={!canChangeStatus}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-ring disabled:opacity-60"
          >
            {studentStatuses.map((status) => (
              <option key={status} value={status}>
                {studentStatusLabels[status]}
              </option>
            ))}
          </select>
          {!canChangeStatus ? <input type="hidden" name="status" value={student.status} /> : null}
        </label>
        <label className="grid gap-2 text-sm font-medium md:col-span-2 xl:col-span-3">
          Talebenin Adresi
          <textarea
            name="address"
            defaultValue={student.address ?? ""}
            rows={4}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm font-normal outline-none focus:border-ring"
          />
        </label>
      </section>
      <div className="flex justify-end">
        <FormSubmitButton pendingLabel="Kaydediliyor...">Değişiklikleri Kaydet</FormSubmitButton>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  value,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  value?: string | null;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={value ?? ""}
        className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-ring"
      />
    </label>
  );
}
