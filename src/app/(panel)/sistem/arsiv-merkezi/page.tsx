import { ArchiveCenterPanel } from "@/components/archives/archive-center-panel";
import { PageHeader } from "@/components/layout/page-header";
import { requireRouteAccess } from "@/lib/auth";
import { getArchiveCenterData } from "@/lib/archives/queries";

type ArchiveCenterPageProps = {
  searchParams: Promise<{ success?: string; error?: string }>;
};

export default async function ArchiveCenterPage({ searchParams }: ArchiveCenterPageProps) {
  const [{ profile }, query] = await Promise.all([requireRouteAccess("/sistem/arsiv-merkezi"), searchParams]);
  const data = await getArchiveCenterData(profile);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Sistem Yönetimi"
        title="Arşiv Merkezi"
        description="Kapalı dönem verilerini PDF ve CSV olarak güvenli şekilde dışarı aktarın."
      />
      {query.success ? <StatusMessage type="success" message={successMessage(query.success)} /> : null}
      {query.error ? <StatusMessage type="error" message={decodeURIComponent(query.error)} /> : null}
      <ArchiveCenterPanel data={data} />
    </div>
  );
}

function StatusMessage({ type, message }: { type: "success" | "error"; message: string }) {
  const className =
    type === "success"
      ? "rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary"
      : "rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive";

  return <div className={className}>{message}</div>;
}

function successMessage(value: string) {
  const messages: Record<string, string> = {
    "export-created": "Export oluşturuldu ve arşiv geçmişine eklendi.",
  };

  return messages[value] ?? value;
}
