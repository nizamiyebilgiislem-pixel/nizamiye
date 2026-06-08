import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { DormitoryAssignmentTable } from "@/components/dormitory/dormitory-assignment-table";
import { DormitoryOccupancyBars } from "@/components/dormitory/dormitory-occupancy-bars";
import { DormitorySummaryGrid } from "@/components/dormitory/dormitory-summary-grid";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { requireAuth } from "@/lib/auth";
import { createDormitoryFloorAction, createDormitoryRoomAction } from "@/lib/dormitory/actions";
import { canManageDormitoryStructure, canViewDormitoryModule } from "@/lib/dormitory/permissions";
import { getDormitoryAssignments, getDormitoryById } from "@/lib/dormitory/queries";
import { cn } from "@/lib/utils";

type DormitoryDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function DormitoryDetailPage({ params }: DormitoryDetailPageProps) {
  const { id } = await params;
  const { profile } = await requireAuth();
  if (!canViewDormitoryModule(profile)) {
    redirect("/veli");
  }

  const [dormitory, placements] = await Promise.all([getDormitoryById(profile, id), getDormitoryAssignments(profile, { dormitoryId: id, status: "all" })]);
  if (!dormitory) {
    notFound();
  }

  const canManage = canManageDormitoryStructure(profile);

  async function createFloorAction(formData: FormData) {
    "use server";
    await createDormitoryFloorAction(formData);
  }

  async function createRoomAction(formData: FormData) {
    "use server";
    await createDormitoryRoomAction(formData);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <PageHeader eyebrow="Yatakhane" title={dormitory.name} description={dormitory.description ?? "Yatakhane açıklaması girilmedi."} />
        <div className="flex flex-wrap gap-2">
          <Link href="/yatakhane/yerlesim" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Yerleşimler
          </Link>
          <Link href="/yatakhane/raporlar" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Raporlar
          </Link>
          {canManage ? (
            <Link href={`/yatakhane/${dormitory.id}/duzenle`} className={cn(buttonVariants({ size: "sm" }))}>
              Düzenle
            </Link>
          ) : null}
        </div>
      </div>

      <DormitorySummaryGrid
        items={[
          { label: "Kat", value: dormitory.floors.length },
          { label: "Oda", value: dormitory.rooms.length },
          { label: "Yatak", value: dormitory.beds.length },
          { label: "Dolu yatak", value: dormitory.beds.filter((bed) => bed.is_active && bed.assignment?.status === "active").length },
          { label: "Boş yatak", value: dormitory.beds.filter((bed) => bed.is_active && !bed.assignment).length },
          { label: "Doluluk", value: `%${dormitory.summary.occupancyPercent}` },
        ]}
      />

      <section className="grid gap-4 xl:grid-cols-2">
        <DormitoryOccupancyBars
          title="Katlar"
          items={dormitory.floors.map((floor) => ({
            label: `${floor.name}${floor.floor_no !== null ? ` (${floor.floor_no})` : ""}`,
            percent: floor.occupancy.percent,
            detail: `${floor.occupancy.occupied} / ${floor.occupancy.total} yatak`,
          }))}
        />
        <div className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-[#093657]">Son Yerleşimler</h2>
            <p className="text-sm text-muted-foreground">Bu yatakhanedeki güncel ve geçmiş yerleşimler.</p>
          </div>
          <DormitoryAssignmentTable items={placements.slice(0, 8)} showActions={canManage} />
        </div>
      </section>

      {canManage ? (
        <section className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle>Kat Ekle</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <form action={createFloorAction} className="space-y-3">
                <input type="hidden" name="dormitory_id" value={dormitory.id} />
                <Input name="name" required placeholder="Kat adı" />
                <Input name="floor_no" type="number" placeholder="Kat no" />
                <div className="flex justify-end">
                  <button type="submit" className={cn(buttonVariants({ size: "sm" }))}>
                    Kat Ekle
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle>Oda Ekle</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <form action={createRoomAction} className="space-y-3">
                <select name="floor_id" required className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm">
                  <option value="">Kat seçin</option>
                  {dormitory.floors.map((floor) => (
                    <option key={floor.id} value={floor.id}>
                      {floor.name}
                    </option>
                  ))}
                </select>
                <Input name="name" required placeholder="Oda adı" />
                <Input name="room_no" placeholder="Oda no" />
                <Input name="capacity" type="number" min="1" max="20" defaultValue="1" placeholder="Kapasite" />
                <Textarea name="note" placeholder="Not" />
                <div className="flex justify-end">
                  <button type="submit" className={cn(buttonVariants({ size: "sm" }))}>
                    Oda Ekle
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        </section>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-[#093657]">Katlar ve Odalar</h2>
        <div className="space-y-3">
          {dormitory.floors.map((floor) => (
            <Card key={floor.id}>
              <CardHeader className="border-b border-border">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>{floor.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{floor.floor_no !== null ? `Kat no: ${floor.floor_no}` : "Kat numarası yok"}</p>
                  </div>
                  <Link href={`/yatakhane/katlar/${floor.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                    Kat Detayı
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
                {floor.rooms.map((room) => (
                  <div key={room.id} className="rounded-md border border-border bg-[#f8fafc] p-3">
                    <p className="font-semibold text-[#093657]">{room.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {room.room_no ? `No: ${room.room_no}` : "No yok"} · Kapasite {room.capacity}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Doluluk: {room.occupancy.occupied}/{room.occupancy.total} · %{room.occupancy.percent}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link href={`/yatakhane/odalar/${room.id}`} className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}>
                        Oda Detayı
                      </Link>
                    </div>
                  </div>
                ))}
                {floor.rooms.length === 0 ? <p className="text-sm text-muted-foreground">Bu katta oda yok.</p> : null}
              </CardContent>
            </Card>
          ))}
          {dormitory.floors.length === 0 ? <p className="text-sm text-muted-foreground">Bu yatakhanede henüz kat yok.</p> : null}
        </div>
      </section>
    </div>
  );
}
