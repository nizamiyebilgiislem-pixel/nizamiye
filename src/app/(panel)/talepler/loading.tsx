import { Loader2 } from "lucide-react";

export default function TaleplerLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="size-8 animate-spin text-[#093657]" />
        <p className="text-sm text-muted-foreground">Talepler yükleniyor...</p>
      </div>
    </div>
  );
}
