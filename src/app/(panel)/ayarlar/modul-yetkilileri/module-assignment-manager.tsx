"use client";

import { useActionState } from "react";
import { UserRoundX, UserRoundCheck } from "lucide-react";

import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createModuleAssignmentAction, deactivateModuleAssignmentAction } from "@/lib/module-assignments/actions";
import type { ModuleAssignmentWithProfile } from "@/lib/module-assignments/queries";
import type { ProfileRow } from "@/types/database";

type ModuleAssignmentManagerProps = {
  moduleKey: string;
  moduleLabel: string;
  assignees: ModuleAssignmentWithProfile[];
  profiles: Array<{ id: string; full_name: string; role: string; department_id: string | null }>;
  assignActionLabel: string;
  emptyMessage: string;
  profile: ProfileRow;
};

export function ModuleAssignmentManager({
  moduleKey,
  moduleLabel,
  assignees,
  profiles,
  assignActionLabel,
  emptyMessage,
}: ModuleAssignmentManagerProps) {
  const [createState, createFormAction] = useActionState(createModuleAssignmentAction, undefined);
  const [deactivateState, deactivateFormAction] = useActionState(deactivateModuleAssignmentAction, undefined);

  const assigneeIds = new Set(assignees.map((a) => a.profile_id));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{moduleLabel} Yetkilileri</CardTitle>
        <CardDescription>{assignActionLabel}.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {createState?.error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{createState.error}</div>
        )}
        {deactivateState?.error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{deactivateState.error}</div>
        )}

        <form action={createFormAction} className="flex flex-wrap gap-2">
          <input type="hidden" name="module_key" value={moduleKey} />
          <select
            name="profile_id"
            className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            required
          >
            <option value="">Kullanıcı seçin...</option>
            {profiles
              .filter((p) => !assigneeIds.has(p.id))
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} ({p.role})
                </option>
              ))}
          </select>
          <FormSubmitButton>{assignActionLabel}</FormSubmitButton>
        </form>

        {assignees.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          <div className="divide-y divide-border rounded-md border">
            {assignees.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex items-center gap-2 min-w-0">
                  <UserRoundCheck className="size-4 shrink-0 text-green-600" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{a.profile?.full_name ?? "Bilinmeyen"}</p>
                    <p className="truncate text-xs text-muted-foreground">{a.profile?.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground">
                    {a.assigned_by_profile?.full_name ?? "Bilinmeyen"} tarafından
                  </span>
                  <form action={deactivateFormAction}>
                    <input type="hidden" name="assignment_id" value={a.id} />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      <UserRoundX className="size-3" />
                      Yetkiyi Kaldır
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
