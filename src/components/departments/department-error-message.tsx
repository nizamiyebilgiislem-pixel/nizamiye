type DepartmentErrorMessageProps = {
  error?: string;
  errorMessage?: string;
};

const errorMessages: Record<string, string> = {
  unauthorized: "Bu işlem için yetkiniz yok.",
  "not-found": "Bölüm kaydı bulunamadı.",
  slug: "Aynı slug'a sahip başka bir bölüm var. Bölüm adını değiştirin.",
  save: "Bölüm kaydedilemedi. Lütfen tekrar deneyin.",
};

export function DepartmentErrorMessage({ error, errorMessage }: DepartmentErrorMessageProps) {
  const message = errorMessage?.trim() || errorMessages[error ?? ""] || error;

  if (!message) {
    return null;
  }

  return (
    <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {message ?? "İşlem tamamlanamadı."}
    </div>
  );
}
