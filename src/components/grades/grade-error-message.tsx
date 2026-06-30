import { Card, CardContent } from "@/components/ui/card";

const messages: Record<string, string> = {
  unauthorized: "Bu işlem için yetkiniz yok.",
  duplicate: "Aynı bölümde aynı isimde bir ders zaten var.",
  "duplicate-exam": "Bu derste aynı isimde bir sınav türü zaten var.",
  save: "Not kaydı tamamlanamadı. Girilen notları ve dönem seçimini kontrol edin.",
  exam: "Sınav türü bilgileri hatalı.",
  grade: "Not değeri 0 ile 100 arasında olmalıdır.",
  empty: "Kaydedilecek not girilmedi.",
  term: "Not kaydı için dönem seçilmelidir.",
  "term-closed": "Aktif dönem kapalı olduğu için sınav girişi yapılamaz.",
  class: "Öğrencinin sınıf bilgisi bulunamadı.",
  "not-found": "Kayıt bulunamadı.",
  selection: "Bölüm, sınıf, ders ve sınav türü seçimini tamamlayın.",
  "no-students": "Seçilen sınıfta aktif öğrenci bulunamadı.",
};

export function GradeErrorMessage({ error }: { error?: string }) {
  if (!error) return null;

  return (
    <Card className="border-destructive/40 bg-destructive/10">
      <CardContent className="py-3 text-sm text-destructive">{messages[error] ?? error}</CardContent>
    </Card>
  );
}
