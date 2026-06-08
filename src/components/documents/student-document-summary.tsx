import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProfileRow, StudentDocumentRow } from "@/types/database";
import { cn } from "@/lib/utils";

type StudentDocument = StudentDocumentRow & { uploaded_by_profile: ProfileRow | null };

export function StudentDocumentSummary({ documents, studentId, canEdit }: { documents: StudentDocument[]; studentId: string; canEdit: boolean }) {
  return (
    <Card>
      <CardHeader className="gap-3 md:flex-row md:items-center md:justify-between">
        <div><CardTitle>Evraklar</CardTitle><p className="mt-1 text-sm text-muted-foreground">Talebeye ait evrak kayıtları.</p></div>
        {canEdit ? <Link href={`/evraklar/ogrenci/${studentId}/yeni`} className={cn(buttonVariants())}>Yeni Evrak Ekle</Link> : null}
      </CardHeader>
      <CardContent className="space-y-3">
        {documents.length > 0 ? documents.map((document) => (
          <div key={document.id} className="rounded-md border border-border bg-background p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="font-semibold">{document.document_type}</h3>
                <p className="mt-1 max-w-xl truncate text-sm text-muted-foreground">{document.file_url}</p>
                <p className="mt-1 text-xs text-muted-foreground">{document.uploaded_by_profile?.full_name ?? "-"} · {formatDate(document.created_at)}</p>
              </div>
              <div className="flex gap-2">
                <a href={document.file_url} target="_blank" rel="noreferrer" className={cn(buttonVariants({ variant: "secondary" }))}><ExternalLink className="size-4" aria-hidden="true" />Dosyayı Aç</a>
                {canEdit ? <Link href={`/evraklar/${document.id}/duzenle`} className={cn(buttonVariants())}>Düzenle</Link> : null}
              </div>
            </div>
          </div>
        )) : <p className="text-sm text-muted-foreground">Evrak kaydı bulunamadı.</p>}
      </CardContent>
    </Card>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(new Date(value));
}
