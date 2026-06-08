import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { DormitoryBedCard } from "@/components/dormitory/dormitory-bed-card";
import { DormitorySummaryGrid } from "@/components/dormitory/dormitory-summary-grid";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { buttonVariants } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth";
import { autoCreateBedsAction, createDormitoryBedAction } from "@/lib/dormitory/actions";
import { canManageDormitoryStructure, canViewDormitoryModule } from "@/lib/dormitory/permissions";
import { getDormitoryRoomById } from "@/lib/dormitory/queries";
import { cn } from "@/lib/utils";

type DormitoryRoomPageProps = {
  params: Promise<{ roomId: string }>;
};

export default async function DormitoryRoomPage({ params }: DormitoryRoomPageProps) {
  const { roomId } = await params;
  const { profile } = await requireAuth();
  if (!canViewDormitoryModule(profile)) {
    redirect("/veli");
  }

  const room = await getDormitoryRoomById(profile, roomId);
  if (!room) {
    notFound();
  }

  const canManage = canManageDormitoryStructure(profile);

  async function autoCreateAction(formData: FormData) {
    "use server";
    await autoCreateBedsAction(formData);
  }

  async function createBedAction(formData: FormData) {
    "use server";
    await createDormitoryBedAction(formData);
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Yatakhane" title={room.name} description={room.dormitory?.name ?? "Oda bilgisi"} />

      <DormitorySummaryGrid
        items={[
          { label: "Yatak", value: room.occupancy.total },
          { label: "Dolu", value: room.occupancy.occupied },
          { label: "Boş", value: room.occupancy.empty },
          { label: "Doluluk", value: `%${room.occupancy.percent}` },
        ]}
      />

      {canManage ? (
        <section className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle>Otomatik Yatak Oluştur</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <form action={autoCreateAction} className="space-y-3">
                <input type="hidden" name="room_id" value={room.id} />
                <p className="text-sm text-muted-foreground">Oda kapasitesine göre eksik yataklar otomatik oluşturulur.</p>
                <div className="flex justify-end">
                  <button type="submit" className={cn(buttonVariants({ size: "sm" }))}>
                    Yatakları Oluştur
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle>Manuel Yatak Ekle</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <form action={createBedAction} className="space-y-3">
                <input type="hidden" name="room_id" value={room.id} />
                <Input name="bed_no" required placeholder="Yatak no" />
                <Textarea name="note" placeholder="Not" />
                <div className="flex justify-end">
                  <button type="submit" className={cn(buttonVariants({ size: "sm" }))}>
                    Yatak Ekle
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        </section>
      ) : null}

      <Card>
        <CardHeader className="border-b border-border">
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Yataklar</CardTitle>
            <Link href={`/yatakhane/katlar/${room.floor_id}`} className={cn("text-sm font-medium text-[#093657] hover:underline")}>
              Kata Dön
            </Link>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
          {room.beds.map((bed) => (
            <DormitoryBedCard key={bed.id} bed={bed} />
          ))}
          {room.beds.length === 0 ? <p className="text-sm text-muted-foreground">Bu odada yatak bulunmuyor.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
