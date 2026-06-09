import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth";
import { canCreateTalep } from "@/lib/talepler/permissions";
import { getUnitOptions } from "@/lib/talepler/queries";
import { TalepForm } from "@/components/talepler/talep-form";

export default async function YeniTalepPage() {
  const { profile } = await requireAuth();

  if (!canCreateTalep(profile)) {
    return <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Bu işlem için yetkiniz bulunmamaktadır.</div>;
  }

  const unitOptions = await getUnitOptions();

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Talep Yönetimi" title="Yeni Talep" description="Bir birime yeni talep oluşturun." />
      <TalepForm unitOptions={unitOptions} />
    </div>
  );
}
