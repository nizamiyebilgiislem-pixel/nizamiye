import Link from "next/link";
import { Plus } from "lucide-react";

import { DocumentErrorMessage } from "@/components/documents/document-error-message";
import { DocumentList } from "@/components/documents/document-list";
import { PageHeader } from "@/components/layout/page-header";
import { Pagination } from "@/components/ui/pagination";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { requireAuth } from "@/lib/auth";
import { documentTypes } from "@/lib/documents/constants";
import { getDocumentsDashboardSummary, getDocumentsForProfile } from "@/lib/documents/queries";
import { cn } from "@/lib/utils";

type DocumentsPageProps = { searchParams: Promise<{ q?: string; department?: string; class?: string; type?: string; from?: string; to?: string; error?: string; page?: string }> };

export default async function DocumentsPage({ searchParams }: DocumentsPageProps) {
  const params = await searchParams;
  const { profile } = await requireAuth();
  const page = Number(params.page) || 1;
  const [summary, list] = await Promise.all([
    getDocumentsDashboardSummary(profile),
    getDocumentsForProfile(profile, { search: params.q, departmentId: params.department, classId: params.class, documentType: params.type, dateFrom: params.from, dateTo: params.to }, page),
  ]);
  const pageSize = 20;
  const totalPages = Math.ceil((list.totalCount ?? 0) / pageSize);
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <PageHeader eyebrow="Evraklar" title="Evrak Yönetimi" description="Talebe evrak URL kayıtlarını yönetin." />
        {profile.role !== "destek_birim_muduru" ? <Link href="/evraklar/yeni" className={cn(buttonVariants())}><Plus className="size-4" aria-hidden="true" />Yeni Evrak</Link> : null}
      </div>
      <DocumentErrorMessage error={params.error} />
      <section className="grid gap-4 md:grid-cols-3">
        <Metric label="Toplam Evrak" value={summary.totalCount} />
        <Metric label="Bu Ay Eklenen" value={summary.currentMonthCount} />
        <Metric label="Evrakı Olmayan Aktif Talebe" value={summary.missingDocumentStudentCount} />
      </section>
      <Card><CardHeader><CardTitle>Evrak Türlerine Göre Dağılım</CardTitle></CardHeader><CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{summary.typeCounts.map((item)=><div key={item.type} className="rounded-md border border-border bg-background p-3"><p className="text-sm text-muted-foreground">{item.type}</p><p className="mt-1 text-2xl font-semibold">{item.count}</p></div>)}</CardContent></Card>
      <Card><CardContent className="p-4"><form action="/evraklar" className="grid gap-3 xl:grid-cols-[1fr_180px_180px_180px_150px_150px_auto]">
        <Input name="q" defaultValue={params.q ?? ""} placeholder="Talebe, tür veya URL" className="h-10" />
        <select name="department" defaultValue={params.department ?? ""} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="">Tüm bölümler</option>{list.departments.map((d)=><option key={d.id} value={d.id}>{d.name}</option>)}</select>
        <select name="class" defaultValue={params.class ?? ""} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="">Tüm sınıflar</option>{list.classes.map((c)=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select name="type" defaultValue={params.type ?? ""} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="">Tüm türler</option>{documentTypes.map((type)=><option key={type} value={type}>{type}</option>)}</select>
        <Input name="from" type="date" defaultValue={params.from ?? ""} className="h-10" />
        <Input name="to" type="date" defaultValue={params.to ?? ""} className="h-10" />
        <Button type="submit">Filtrele</Button>
      </form></CardContent></Card>
      <div><h2 className="mb-3 text-lg font-semibold">Son Eklenen 10 Evrak</h2><DocumentList documents={summary.latestDocuments} profile={profile} /></div>
      <div><h2 className="mb-3 text-lg font-semibold">Evrak Listesi</h2>{list.documents.length > 0 ? <><DocumentList documents={list.documents} profile={profile} />        <Pagination currentPage={page} totalPages={totalPages} basePath="/evraklar" searchParams={params} /></> : <EmptyState title="Evrak bulunamadı." />}</div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-semibold">{value}</p></CardContent></Card>;
}
