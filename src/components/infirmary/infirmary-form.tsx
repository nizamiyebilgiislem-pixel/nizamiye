import type { InfirmaryRecordWithRelations } from "@/lib/infirmary/queries";
import type { StudentRow } from "@/types/database";

export function InfirmaryForm({
  action,
  students,
  fixedStudent,
  record,
}: {
  action: (formData: FormData) => void | Promise<void>;
  students?: StudentRow[];
  fixedStudent?: StudentRow;
  record?: InfirmaryRecordWithRelations;
}) {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <form action={action} className="space-y-5">
      {record ? <input type="hidden" name="id" value={record.id} /> : null}
      {fixedStudent || record?.student ? (
        <input type="hidden" name="student_id" value={(fixedStudent ?? record?.student)?.id} />
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        {fixedStudent || record?.student ? (
          <div className="rounded-md border border-border bg-background p-3">
            <p className="text-xs text-muted-foreground">Talebe</p>
            <p className="mt-1 text-sm font-medium">{(fixedStudent ?? record?.student)?.full_name}</p>
          </div>
        ) : (
          <label className="grid gap-2 text-sm font-medium">
            Talebe
            <select name="student_id" required className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal">
              {students?.map((student) => <option key={student.id} value={student.id}>{student.full_name}</option>)}
            </select>
          </label>
        )}
        <Field label="Kayıt Tarihi" name="record_date" type="date" value={record?.record_date ?? today} required />
        <TextArea label="Şikayet" name="complaint" value={record?.complaint} />
        <TextArea label="Yapılan Müdahale / Tedavi" name="treatment" value={record?.treatment} />
        <label className="grid gap-2 text-sm font-medium">
          Hastaneye Sevk Edildi mi?
          <select name="sent_to_hospital" defaultValue={String(record?.sent_to_hospital ?? false)} className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal">
            <option value="false">Hayır</option>
            <option value="true">Evet</option>
          </select>
        </label>
        <Field label="Hastane Adı" name="hospital_name" value={record?.hospital_name} />
        <Field label="Verilen İlaç" name="medication_given" value={record?.medication_given} />
        <label className="grid gap-2 text-sm font-medium">
          Veli Bilgilendirildi mi?
          <select name="parent_informed" defaultValue={String(record?.parent_informed ?? false)} className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal">
            <option value="false">Hayır</option>
            <option value="true">Evet</option>
          </select>
        </label>
        <div className="md:col-span-2"><TextArea label="Not" name="note" value={record?.note} /></div>
      </div>
      <div className="flex justify-end">
        <button type="submit" className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">Revir Kaydını Kaydet</button>
      </div>
    </form>
  );
}

function Field({ label, name, value, type = "text", required }: { label: string; name: string; value?: string | null; type?: string; required?: boolean }) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <input name={name} type={type} required={required} defaultValue={value ?? ""} className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal" />
    </label>
  );
}

function TextArea({ label, name, value }: { label: string; name: string; value?: string | null }) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <textarea name={name} rows={4} defaultValue={value ?? ""} className="rounded-md border border-input bg-background px-3 py-2 text-sm font-normal" />
    </label>
  );
}
