import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth";
import { canManageAnnouncements } from "@/lib/duyurular/permissions";
import { getAnnouncementById } from "@/lib/duyurular/queries";
import { AnnouncementForm } from "@/components/duyurular/announcement-form";

export default async function DuyuruDuzenlePage({ params }: { params: Promise<{ id: string }> }) {
  const { profile } = await requireAuth();
  const { id } = await params;

  if (!canManageAnnouncements(profile)) {
    return <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Bu işlem için yetkiniz bulunmamaktadır.</div>;
  }

  const announcement = await getAnnouncementById(id);
  if (!announcement) notFound();

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Duyurular" title="Duyuru Düzenle" description={`${announcement.title} duyurusunu düzenleyin.`} />
      <AnnouncementForm
        defaultValues={{
          id: announcement.id,
          title: announcement.title,
          content: announcement.content,
          target_role: announcement.target_role ?? "",
          is_published: announcement.is_published,
        }}
      />
    </div>
  );
}
