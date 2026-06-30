"use client";

import { useActionState } from "react";
import { X } from "lucide-react";

import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { assignTeacherDutyAction, assignStudentDutyAction, removeDutyAction } from "@/lib/tasks/duty-actions";
import type { DutyTeacher, DutyStudent } from "@/lib/tasks/duty-queries";

type AssignableProfile = {
  id: string;
  full_name: string;
  role: string;
};

type StudentOption = {
  id: string;
  full_name: string;
  className: string;
};

type NobetciFormProps =
  | {
      type: "teacher";
      assignableProfiles: AssignableProfile[];
      students?: never;
      todayDate: string;
      currentDuties: DutyTeacher[];
    }
  | {
      type: "student";
      assignableProfiles?: never;
      students: StudentOption[];
      todayDate: string;
      currentDuties: DutyStudent[];
    };

export function NobetciForm(props: NobetciFormProps) {
  const { type, todayDate, currentDuties } = props;

  const action = type === "teacher" ? assignTeacherDutyAction : assignStudentDutyAction;
  const [state, formAction] = useActionState(action, undefined);
  const [removeState, removeFormAction] = useActionState(removeDutyAction, undefined);

  const title = type === "teacher" ? "Nöbetçi Hoca" : "Nöbetçi Talebe";
  const description = type === "teacher"
    ? "Bir hocayı belirli bir tarihte nöbetçi olarak atayın."
    : "Bir öğrenciyi belirli bir tarihte nöbetçi olarak atayın.";

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <form action={formAction} className="space-y-4">
          {type === "teacher" && props.assignableProfiles ? (
            <label className="grid gap-2 text-sm font-medium">
              Hoca
              <NativeSelect
                name="assigned_to"
                required
              >
                <option value="">Hoca seçin</option>
                {props.assignableProfiles
                  .filter((p) => p.role === "hoca")
                  .map((p) => (
                    <option key={p.id} value={p.id}>{p.full_name}</option>
                  ))}
              </NativeSelect>
            </label>
          ) : null}

          {type === "student" && props.students ? (
            <label className="grid gap-2 text-sm font-medium">
              Öğrenci
              <NativeSelect
                name="student_id"
                required
              >
                <option value="">Öğrenci seçin</option>
                {props.students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name}{s.className ? ` (${s.className})` : ""}
                  </option>
                ))}
              </NativeSelect>
            </label>
          ) : null}

          <label className="grid gap-2 text-sm font-medium">
            Tarih
            <Input
              type="date"
              name="date"
              required
              defaultValue={todayDate}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium">
            Not (isteğe bağlı)
            <Input
              name="note"
              placeholder="örn: Sabah nöbeti"
            />
          </label>

          {state?.error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</div>
          )}

          {state?.success && (
            <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">Nöbetçi atandı.</div>
          )}

          <FormSubmitButton pendingLabel="Atanıyor...">{title} Ata</FormSubmitButton>
        </form>

        <div>
          <h4 className="mb-2 text-sm font-medium text-muted-foreground">Bugünün Nöbetçileri</h4>
          {currentDuties.length === 0 ? (
            <p className="text-sm text-muted-foreground">Bugün için atanmış nöbetçi bulunmuyor.</p>
          ) : (
            <ul className="space-y-2">
              {currentDuties.map((duty) => (
                <li key={duty.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {type === "teacher"
                        ? (duty as DutyTeacher).personName
                        : (duty as DutyStudent).studentName}
                    </span>
                    {type === "student" && (duty as DutyStudent).className ? (
                      <span className="text-muted-foreground">({(duty as DutyStudent).className})</span>
                    ) : null}
                    {duty.note ? (
                      <span className="text-muted-foreground">— {duty.note}</span>
                    ) : null}
                  </div>
                  <form action={removeFormAction}>
                    <input type="hidden" name="id" value={duty.id} />
                    <input type="hidden" name="type" value={type} />
                    <button
                      type="submit"
                      className="text-muted-foreground hover:text-red-600 transition-colors"
                      aria-label="Kaldır"
                    >
                      <X className="size-4" />
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
          {removeState?.error && (
            <p className="mt-2 text-xs text-red-600">{removeState.error}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
