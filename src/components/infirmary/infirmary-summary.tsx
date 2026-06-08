import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { InfirmaryRecordRow, ProfileRow } from "@/types/database";
import { cn } from "@/lib/utils";

type StudentInfirmaryRecord = InfirmaryRecordRow & { created_by_profile: ProfileRow | null };

export function StudentInfirmarySummary({ records, studentId, canEdit }: { records: StudentInfirmaryRecord[]; studentId: string; canEdit: boolean }) {
  return (
    <Card>
      <CardHeader className="gap-3 md:flex-row md:items-center md:justify-between">
        <div><CardTitle>Revir Kayıtları</CardTitle><p className="mt-1 text-sm text-muted-foreground">Talebenin sağlık/revir geçmişi.</p></div>
        {canEdit ? <Link href={`/revir/ogrenci/${studentId}/yeni`} className={cn(buttonVariants())}>Yeni Revir Kaydı</Link> : null}
      </CardHeader>
      <CardContent className="space-y-3">
        {records.length > 0 ? records.map((record) => (
          <div key={record.id} className="rounded-md border border-border bg-background p-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <h3 className="font-semibold">{record.record_date}</h3>
              <p className="text-sm text-muted-foreground">{record.created_by_profile?.full_name ?? "-"}</p>
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              <Info label="Şikayet" value={record.complaint} />
              <Info label="Tedavi" value={record.treatment} />
              <Info label="Hastane Sevk" value={record.sent_to_hospital ? "Evet" : "Hayır"} />
              <Info label="Veli Bilgilendirildi" value={record.parent_informed ? "Evet" : "Hayır"} />
              <Info label="Not" value={record.note} />
              {canEdit ? <Link href={`/revir/${record.id}/duzenle`} className={cn(buttonVariants({ variant: "secondary" }))}>Düzenle</Link> : null}
            </div>
          </div>
        )) : <p className="text-sm text-muted-foreground">Revir kaydı bulunamadı.</p>}
      </CardContent>
    </Card>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return <div className="rounded-md border border-border bg-card p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-sm font-medium">{value || "-"}</p></div>;
}
