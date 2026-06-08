import { Card, CardContent } from "@/components/ui/card";

const messages: Record<string, string> = {
  unauthorized: "Bu işlem için yetkiniz yok.",
  "not-found": "Kayıt bulunamadı.",
  duplicate: "Bu sınıf için aynı ders zaten tanımlı.",
  teacher: "Seçilen hoca bu bölüm için uygun değil.",
  course: "Seçilen ders aktif değil veya bu sınıfa ait değil.",
  "duplicate-slot": "Bu gün ve ders saati için zaten bir program kaydı var.",
  policy: "Veritabanı izinleri bu işlemi engelliyor. Supabase policy/RLS kontrol edilmeli.",
  load: "İlgili kayıtlar alınamadı. Bağlantı veya izin sorunu olabilir.",
  save: "Eğitim planlama kaydı tamamlanamadı. Seçilen ders, hoca ve sınıf bilgilerini kontrol edin.",
  class: "Sınıf bilgisi bulunamadı.",
};

export function EducationErrorMessage({ error, saved }: { error?: string; saved?: string }) {
  if (error) {
    return (
      <Card className="border-destructive/40 bg-destructive/10">
        <CardContent className="py-3 text-sm text-destructive">{messages[error] ?? error}</CardContent>
      </Card>
    );
  }

  if (saved) {
    return (
      <Card className="border-primary/40 bg-primary/10">
        <CardContent className="py-3 text-sm text-primary">Kayıt başarılı.</CardContent>
      </Card>
    );
  }

  return null;
}
