import { Card, CardContent } from "@/components/ui/card";

type ClassErrorMessageProps = {
  error?: string;
  errorMessage?: string;
};

const errorMessages: Record<string, string> = {
  unauthorized: "Bu işlem için yetkiniz yok.",
  department: "Bölüm bilgisi geçerli değil.",
  teacher: "Seçilen sınıf hocası bu bölüm için uygun değil.",
  duplicate: "Bu bölümde aynı isimde bir sınıf zaten var.",
  save: "Sınıf kaydı tamamlanamadı. Bölüm, sınıf adı ve hoca bilgilerini kontrol edin.",
  "not-found": "Sınıf bulunamadı.",
};

export function ClassErrorMessage({ error, errorMessage }: ClassErrorMessageProps) {
  const message = errorMessage?.trim() || errorMessages[error ?? ""] || error;

  if (!message) {
    return null;
  }

  return (
    <Card className="border-destructive/40 bg-destructive/10">
      <CardContent className="py-3 text-sm text-destructive">{message}</CardContent>
    </Card>
  );
}
