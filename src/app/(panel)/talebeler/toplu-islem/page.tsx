import { requireAuth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { StudentBatchForm } from "@/components/students/student-batch-form";

export default async function TopluIslemPage() {
  const { profile } = await requireAuth();

  if (!["admin", "genel_mudur", "bolum_muduru"].includes(profile.role)) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        Bu işlem için yetkiniz bulunmamaktadır.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Talebeler"
        title="Toplu İşlem"
        description="Seçilen öğrencilerin durumunu topluca güncelleyin."
      />
      <StudentBatchForm />
    </div>
  );
}
