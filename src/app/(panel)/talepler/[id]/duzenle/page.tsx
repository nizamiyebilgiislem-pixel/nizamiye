import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth";
import { canEditTalep } from "@/lib/talepler/permissions";
import { getTalepById, getUnitOptions } from "@/lib/talepler/queries";
import { TalepForm } from "@/components/talepler/talep-form";

export default async function TalepDuzenlePage({ params }: { params: Promise<{ id: string }> }) {
  const { profile } = await requireAuth();
  const { id } = await params;

  const talep = await getTalepById(id);
  if (!talep) notFound();

  if (!canEditTalep(profile, talep)) {
    return <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Bu işlem için yetkiniz bulunmamaktadır.</div>;
  }

  const unitOptions = await getUnitOptions();

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Talep Yönetimi" title="Talebi Düzenle" description={`${talep.title} talebini düzenleyin.`} />
      <TalepForm
        unitOptions={unitOptions}
        defaultValues={{
          id: talep.id,
          title: talep.title,
          description: talep.description,
        }}
      />
    </div>
  );
}
