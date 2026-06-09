"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

import { useToast } from "@/components/toast/toast-provider";
import { errorMessages, successMessages } from "@/lib/toast/messages";

export function RouteToast() {
  const searchParams = useSearchParams();
  const { addToast } = useToast();
  const shownRef = useRef(new Set<string>());

  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    const errorMessage = searchParams.get("errorMessage");

    if (success && !shownRef.current.has(`success:${success}`)) {
      shownRef.current.add(`success:${success}`);
      const title = successMessages[success] ?? "İşlem başarılı.";
      addToast("success", title);

      const url = new URL(window.location.href);
      url.searchParams.delete("success");
      window.history.replaceState(null, "", url.toString());
    }

    if (error && !shownRef.current.has(`error:${error}`)) {
      shownRef.current.add(`error:${error}`);
      const title = errorMessage ?? errorMessages[error] ?? "Bir hata oluştu.";
      addToast("error", title);

      const url = new URL(window.location.href);
      url.searchParams.delete("error");
      url.searchParams.delete("errorMessage");
      window.history.replaceState(null, "", url.toString());
    }
  }, [searchParams, addToast]);

  return null;
}
