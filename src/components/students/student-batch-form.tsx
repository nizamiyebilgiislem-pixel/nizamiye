"use client";

import { useActionState } from "react";

import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { batchUpdateStudentStatusAction } from "@/lib/students/actions";

export function StudentBatchForm() {
  const [state, formAction] = useActionState(batchUpdateStudentStatusAction, undefined);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Durum Güncelle</CardTitle>
        <CardDescription>
          Öğrenci ID'lerini alt alta girin ve yeni durumu seçin. ID'leri öğrenci listesinden kopyalayabilirsiniz.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <label className="grid gap-2 text-sm font-medium">
            Öğrenci ID'leri (her satıra bir ID)
            <Textarea
              name="student_ids_raw"
              rows={8}
              placeholder="abc123-def456&#10;ghi789-jkl012&#10;mno345-pqr678"
              required
            />
          </label>

          <label className="grid gap-2 text-sm font-medium">
            Yeni Durum
            <NativeSelect name="status" required>
              <option value="active">Aktif</option>
              <option value="passive">Pasif</option>
              <option value="graduated">Mezun</option>
              <option value="left">Ayrıldı</option>
            </NativeSelect>
          </label>

          {state?.error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</div>
          )}

          {state?.success && (
            <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              Öğrenci durumları güncellendi.
            </div>
          )}

          <FormSubmitButton pendingLabel="Güncelleniyor...">Durumları Güncelle</FormSubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
