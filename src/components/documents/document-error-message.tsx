import { Card, CardContent } from "@/components/ui/card";

const messages: Record<string, string> = {
  unauthorized: "Bu işlem için yetkiniz yok.",
  save: "Evrak kaydı tamamlanamadı. Dosya bağlantısını ve talebe seçimini kontrol edin.",
  "not-found": "Evrak bulunamadı.",
};

export function DocumentErrorMessage({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <Card className="border-destructive/40 bg-destructive/10">
      <CardContent className="py-3 text-sm text-destructive">{messages[error] ?? error}</CardContent>
    </Card>
  );
}
