import { Card, CardContent } from "@/components/ui/card";
import { ConversationListSkeleton } from "@/components/messages";

export default function MesajlarLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="h-5 w-20 bg-[#e8e8e8] rounded animate-pulse" />
          <div className="h-8 w-32 bg-[#e8e8e8] rounded animate-pulse" />
        </div>
        <div className="h-9 w-28 bg-[#e8e8e8] rounded animate-pulse" />
      </div>
      <Card>
        <CardContent className="p-0">
          <ConversationListSkeleton />
        </CardContent>
      </Card>
    </div>
  );
}