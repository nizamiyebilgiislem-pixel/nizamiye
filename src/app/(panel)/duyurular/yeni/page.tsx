import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth";
import { canCreateAnnouncements } from "@/lib/duyurular/permissions";
import { AnnouncementForm } from "@/components/duyurular/announcement-form";

export default async function YeniDuyuruPage() {
  const { profile } = await requireAuth();

  if (!canCreateAnnouncements(profile)) {
    return <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Bu işlem için yetkiniz bulunmamaktadır.</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Duyurular" title="Yeni Duyuru" description="Yeni bir duyuru oluşturun." />
      <AnnouncementForm />
    </div>
  );
}
