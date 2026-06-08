import { Card, CardContent } from "@/components/ui/card";

type AccountFeedbackProps = {
  error?: string;
  success?: string;
};

const errorMessages: Record<string, string> = {
  save: "Profil güncellenemedi. Lütfen bilgileri kontrol edin.",
  photo: "Fotoğraf yüklenemedi. Lütfen JPEG, PNG veya WebP formatında ve 3 MB altında bir dosya seçin.",
  "photo-upload": "Fotoğraf yükleme sırasında hata oluştu. Storage ayarlarını kontrol edin.",
  "password-update": "Şifre güncellenemedi. Oturum durumunu kontrol edip tekrar deneyin.",
};

const successMessages: Record<string, string> = {
  "profile-updated": "Profil bilgileri güncellendi.",
  "password-updated": "Şifre başarıyla güncellendi.",
};

export function AccountFeedback({ error, success }: AccountFeedbackProps) {
  if (error) {
    return (
      <Card className="border-destructive/40 bg-destructive/10">
        <CardContent className="py-3 text-sm text-destructive">{errorMessages[error] ?? error}</CardContent>
      </Card>
    );
  }

  if (success) {
    return (
      <Card className="border-primary/40 bg-primary/10">
        <CardContent className="py-3 text-sm text-primary">{successMessages[success] ?? success}</CardContent>
      </Card>
    );
  }

  return null;
}
