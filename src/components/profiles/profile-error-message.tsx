import { Card, CardContent } from "@/components/ui/card";

type ProfileErrorMessageProps = {
  error?: string;
};

const errorMessages: Record<string, string> = {
  unauthorized: "Bu işlem için yetkiniz yok.",
  email: "Bu e-posta adresi başka bir profilde kullanılıyor.",
  "auth-email": "Bu e-posta Supabase Auth tarafında zaten kayıtlı.",
  "auth-create": "Auth kullanıcısı oluşturulamadı.",
  "auth-rollback": "Auth kullanıcısı oluşturuldu ancak profil kaydı bağlanırken hata oldu. Geri alma denendi.",
  "auth-exists": "Bu profil zaten bir Auth hesabına bağlı.",
  "auth-missing": "Bu profil için bağlı bir Auth hesabı yok.",
  "auth-password": "Geçici şifre güncellenemedi.",
  photo: "Fotoğraf yüklenemedi. Lütfen JPEG, PNG veya WebP formatında ve 3 MB altında bir dosya seçin.",
  "photo-upload": "Fotoğraf Supabase Storage alanına yüklenemedi. profile-photos bucket ve storage policy ayarlarını kontrol edin.",
  save: "Profil kaydı tamamlanamadı. Rol, bölüm ve iletişim bilgilerini kontrol edin.",
  "not-found": "Profil bulunamadı.",
  "department-forbidden": "Bölüm müdürü sadece kendi bölümüne öğretmen ekleyebilir veya düzenleyebilir.",
  "department-missing": "Bölüm müdürünün bölümü atanmamış. Lütfen sistem yöneticisine başvurun.",
};

export function ProfileErrorMessage({ error }: ProfileErrorMessageProps) {
  if (!error) {
    return null;
  }

  return (
    <Card className="border-destructive/40 bg-destructive/10">
      <CardContent className="py-3 text-sm text-destructive">{errorMessages[error] ?? error}</CardContent>
    </Card>
  );
}
