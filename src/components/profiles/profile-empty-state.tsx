import { Card, CardContent } from "@/components/ui/card";

export function ProfileEmptyState({ title, description }: { title: string; description: string }) {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#eaf1f6] text-[#093657]">
          <span className="text-lg font-semibold">i</span>
        </div>
        <h2 className="mt-4 text-lg font-semibold text-[#093657]">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
