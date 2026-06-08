import { Card, CardContent } from "@/components/ui/card";

const messages: Record<string, string> = {
  unauthorized: "Bu işlem için yetkiniz yok.",
  save: "Revir kaydı tamamlanamadı. Talebe ve kayıt bilgilerini kontrol edin.",
  "not-found": "Revir kaydı bulunamadı.",
};

export function InfirmaryErrorMessage({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <Card className="border-destructive/40 bg-destructive/10">
      <CardContent className="py-3 text-sm text-destructive">{messages[error] ?? error}</CardContent>
    </Card>
  );
}
