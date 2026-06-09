"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { FormSubmitButton } from "@/components/forms/form-submit-button";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type StudentOption = { id: string; full_name: string };

type AssignStudentFormProps = {
  dormitoryId: string;
  action: (previousState: unknown, formData: FormData) => Promise<{ success?: boolean; dormitory_id?: string; error?: string }>;
};

export function AssignStudentForm({ dormitoryId, action }: AssignStudentFormProps) {
  const router = useRouter();
  const [state, formAction] = useActionState(action, undefined);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (state?.success && state?.dormitory_id) {
      router.push(`/yatakhane/${state.dormitory_id}`);
    }
  }, [state, router]);

  useEffect(() => {
    async function loadStudents() {
      try {
        const res = await fetch("/api/dormitory/available-students");
        const data = await res.json();
        setStudents(data.students ?? []);
      } catch {
        setStudents([]);
      } finally {
        setLoading(false);
      }
    }

    loadStudents();
  }, []);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="dormitory_id" value={dormitoryId} />

      <label className="grid gap-2 text-sm font-medium">
        Talebe
        <select
          name="student_id"
          required
          className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-ring"
        >
          <option value="" disabled>Talebe seçin</option>
          {loading ? (
            <option value="" disabled>Yükleniyor...</option>
          ) : (
            students.map((student) => (
              <option key={student.id} value={student.id}>{student.full_name}</option>
            ))
          )}
        </select>
      </label>

      <label className="grid gap-2 text-sm font-medium">
        Başlangıç Tarihi
        <input
          name="start_date"
          type="date"
          required
          defaultValue={new Date().toISOString().split("T")[0]}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus:border-ring"
        />
      </label>

      <label className="grid gap-2 text-sm font-medium">
        Not
        <textarea
          name="note"
          placeholder="Opsiyonel not"
          rows={2}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm font-normal outline-none focus:border-ring"
        />
      </label>

      {state?.error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</div>
      )}

      <div className="flex items-center gap-3">
        <FormSubmitButton pendingLabel="Kaydediliyor...">Yerleştir</FormSubmitButton>
        <Link href={`/yatakhane/${dormitoryId}`} className={cn(buttonVariants({ variant: "outline" }))}>İptal</Link>
      </div>
    </form>
  );
}
