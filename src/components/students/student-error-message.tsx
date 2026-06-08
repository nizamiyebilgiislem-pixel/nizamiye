import { Card, CardContent } from "@/components/ui/card";

type StudentErrorMessageProps = {
  error?: string;
  errorMessage?: string;
};

const errorMessages: Record<string, string> = {
  unauthorized: "Bu işlem için yetkiniz yok.",
  profile: "Aktif profil bulunamadı.",
  class: "Seçilen sınıf geçerli değil.",
  photo: "Fotoğraf yüklenemedi. Lütfen JPEG, PNG veya WebP formatında ve 3 MB altında bir dosya seçin.",
  "photo-upload": "Fotoğraf Supabase Storage alanına yüklenemedi. student-photos bucket ve storage policy ayarlarını kontrol edin.",
  save: "Talebe kaydı tamamlanamadı. Zorunlu alanları ve sınıf seçimini kontrol edin.",
  "not-found": "Talebe bulunamadı.",
  "profile-note-save": "Profil yorumu kaydedilemedi. Dönem ve yorum alanını kontrol edin.",
  "book-save": "Kitap kaydı eklenemedi. Kitap adı ve tarih alanlarını kontrol edin.",
};

export function StudentErrorMessage({ error, errorMessage }: StudentErrorMessageProps) {
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
