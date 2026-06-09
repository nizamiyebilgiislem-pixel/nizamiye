import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { documentTypes } from "@/lib/documents/constants";
import type { StudentDocumentWithRelations } from "@/lib/documents/queries";
import type { StudentRow } from "@/types/database";

export function DocumentForm({
  action,
  students,
  fixedStudent,
  document,
}: {
  action: (formData: FormData) => void | Promise<void>;
  students?: StudentRow[];
  fixedStudent?: StudentRow;
  document?: StudentDocumentWithRelations;
}) {
  return (
    <form action={action} className="space-y-5">
      {document ? <input type="hidden" name="id" value={document.id} /> : null}
      {fixedStudent || document?.student ? <input type="hidden" name="student_id" value={(fixedStudent ?? document?.student)?.id} /> : null}
      <div className="grid gap-4 md:grid-cols-2">
        {fixedStudent || document?.student ? (
          <div className="rounded-md border border-border bg-background p-3">
            <p className="text-xs text-muted-foreground">Talebe</p>
            <p className="mt-1 text-sm font-medium">{(fixedStudent ?? document?.student)?.full_name}</p>
          </div>
        ) : (
          <label className="grid gap-2 text-sm font-medium">
            Talebe
            <select name="student_id" required className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal">
              {students?.map((student) => <option key={student.id} value={student.id}>{student.full_name}</option>)}
            </select>
          </label>
        )}
        <label className="grid gap-2 text-sm font-medium">
          Evrak Türü
          <select name="document_type" required defaultValue={document?.document_type ?? documentTypes[0]} className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal">
            {documentTypes.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium md:col-span-2">
          Dosya URL
          <input name="file_url" type="url" required defaultValue={document?.file_url ?? ""} className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal" />
        </label>
      </div>
      <div className="flex justify-end">
        <FormSubmitButton pendingLabel="Kaydediliyor...">Evrakı Kaydet</FormSubmitButton>
      </div>
    </form>
  );
}
