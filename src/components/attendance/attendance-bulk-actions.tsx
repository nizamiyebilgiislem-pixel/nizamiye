"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

type AttendanceBulkActionsProps = {
  allowedStatuses: string[];
};

export function AttendanceBulkActions({ allowedStatuses }: AttendanceBulkActionsProps) {
  const [showAbsenteesOnly, setShowAbsenteesOnly] = useState(false);

  function getStatusSelects(trigger: HTMLButtonElement) {
    const form = trigger.closest("form");
    if (!form) {
      return [];
    }

    return Array.from(form.querySelectorAll<HTMLSelectElement>("select[data-attendance-status='true']"));
  }

  function applyStatus(trigger: HTMLButtonElement, nextStatus: string) {
    const selects = getStatusSelects(trigger);
    for (const select of selects) {
      select.value = nextStatus;
      select.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  function toggleAbsenteesOnly(trigger: HTMLButtonElement) {
    const nextValue = !showAbsenteesOnly;
    setShowAbsenteesOnly(nextValue);

    const form = trigger.closest("form");
    if (!form) {
      return;
    }

    const rows = Array.from(form.querySelectorAll<HTMLElement>("[data-attendance-row='true']"));
    for (const row of rows) {
      const select = row.querySelector<HTMLSelectElement>("select[data-attendance-status='true']");
      const isPresent = !select || select.value === "present";
      row.style.display = nextValue && isPresent ? "none" : "";
    }
  }

  const canSetPresent = allowedStatuses.includes("present");
  const canSetAbsent = allowedStatuses.includes("absent");

  return (
    <div className="flex flex-wrap gap-2">
      {canSetPresent ? (
        <Button type="button" variant="outline" size="sm" onClick={(event) => applyStatus(event.currentTarget, "present")}>
          Tümünü Var
        </Button>
      ) : null}
      {canSetAbsent ? (
        <Button type="button" variant="outline" size="sm" onClick={(event) => applyStatus(event.currentTarget, "absent")}>
          Tümünü Yok
        </Button>
      ) : null}
      <Button type="button" variant="outline" size="sm" onClick={(event) => toggleAbsenteesOnly(event.currentTarget)}>
        {showAbsenteesOnly ? "Tümünü Göster" : "Sadece Devamsızları Göster"}
      </Button>
    </div>
  );
}
