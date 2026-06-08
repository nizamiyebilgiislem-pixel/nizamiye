import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { DormitoryBedCard } from "@/components/dormitory/dormitory-bed-card";
import { DormitorySummaryGrid } from "@/components/dormitory/dormitory-summary-grid";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth";
import { canViewDormitoryModule } from "@/lib/dormitory/permissions";
import { getDormitoryFloorById } from "@/lib/dormitory/queries";
import { cn } from "@/lib/utils";

type DormitoryFloorPageProps = {
  params: Promise<{ floorId: string }>;
};

export default async function DormitoryFloorPage({ params }: DormitoryFloorPageProps) {
  const { floorId } = await params;
  const { profile } = await requireAuth();
  if (!canViewDormitoryModule(profile)) {
    redirect("/veli");
  }

  const floor = await getDormitoryFloorById(profile, floorId);
  if (!floor) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Yatakhane" title={floor.name} description={floor.dormitory?.name ?? "Kat bilgisi"} />

      <DormitorySummaryGrid
        items={[
          { label: "Oda", value: floor.rooms.length },
          { label: "Yatak", value: floor.occupancy.total },
          { label: "Dolu", value: floor.occupancy.occupied },
          { label: "Boş", value: floor.occupancy.empty },
          { label: "Doluluk", value: `%${floor.occupancy.percent}` },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        {floor.rooms.map((room) => (
          <Card key={room.id}>
            <CardHeader className="border-b border-border">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>{room.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {room.room_no ? `Oda no: ${room.room_no}` : "Oda no yok"} · Kapasite {room.capacity}
                  </p>
                </div>
                <Link href={`/yatakhane/odalar/${room.id}`} className={cn("text-sm font-medium text-[#093657] hover:underline")}>
                  Oda Detayı
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 p-4">
              <p className="text-sm text-muted-foreground">
                Doluluk: {room.occupancy.occupied}/{room.occupancy.total} · %{room.occupancy.percent}
              </p>
              <div className="grid gap-3">
                {room.beds.map((bed) => (
                  <DormitoryBedCard key={bed.id} bed={bed} showActions={false} />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
        {floor.rooms.length === 0 ? <p className="text-sm text-muted-foreground">Bu katta oda bulunmuyor.</p> : null}
      </div>
    </div>
  );
}
