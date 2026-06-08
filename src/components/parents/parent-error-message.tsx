import { Card, CardContent } from "@/components/ui/card";

type ParentErrorMessageProps = {
  error?: string;
};

const errorMessages: Record<string, string> = {
  unauthorized: "Bu işlem için yetkiniz yok.",
  email: "Bu e-posta adresi başka bir profilde kullanılıyor.",
  "auth-email": "Bu e-posta Supabase Auth tarafında zaten kayıtlı.",
  "auth-create": "Auth kullanıcısı oluşturulamadı.",
  "auth-rollback": "Auth kullanıcısı oluşturuldu ancak profil bağlama sırasında hata oldu. Geri alma denendi.",
  "auth-exists": "Bu profil zaten bir Auth hesabına bağlı.",
  "auth-missing": "Bu profil için bağlı bir Auth hesabı bulunmuyor.",
  "auth-password": "Geçici şifre atanamadı.",
  photo: "Fotoğraf yüklenemedi. Lütfen JPEG, PNG veya WebP formatında ve 3 MB altında bir dosya seçin.",
  "photo-upload": "Fotoğraf Supabase Storage alanına yüklenemedi. profile-photos bucket ve storage policy ayarlarını kontrol edin.",
  save: "Veli kaydı tamamlanamadı.",
  "student-required": "En az bir talebe seçin.",
  "parent-links": "Veli oluşturuldu ama talebe bağlantısı kurulamadı.",
  "parent-link-create": "Veli-talebe bağlantısı kurulamadı.",
  "parent-link-remove": "Veli-talebe bağlantısı kaldırılamadı.",
  "not-found": "Veli profili bulunamadı.",
};

export function ParentErrorMessage({ error }: ParentErrorMessageProps) {
  if (!error) {
    return null;
  }

  return (
    <Card className="border-destructive/40 bg-destructive/10">
      <CardContent className="py-3 text-sm text-destructive">{errorMessages[error] ?? error}</CardContent>
    </Card>
  );
}
