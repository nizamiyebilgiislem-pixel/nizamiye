import { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center py-12 text-center">
        {Icon ? (
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#eaf1f6] text-[#093657]">
            <Icon className="size-6" />
          </div>
        ) : (
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#eaf1f6] text-[#093657]">
            <span className="text-lg font-semibold">i</span>
          </div>
        )}
        <h2 className="mt-4 text-lg font-semibold text-[#093657]">{title}</h2>
        {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
        {action && <div className="mt-4">{action}</div>}
      </CardContent>
    </Card>
  );
}