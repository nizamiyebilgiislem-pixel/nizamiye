import { Archive, Download, FileSpreadsheet, FileText, Landmark, School, Users } from "lucide-react";

import { createArchiveExportAction, downloadArchiveExportAction } from "@/lib/archives/actions";
import type { ArchiveCenterData, ArchiveExportWithCreator } from "@/lib/archives/queries";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export function ArchiveCenterPanel({ data }: { data: ArchiveCenterData }) {
  const hasClosedTerms = data.closedTerms.length > 0;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-4">
        <ExportCard
          icon={Users}
          title="Öğrenci Arşivleri"
          description="Öğrenci kimlik bilgileri ve dönem geçmişini PDF olarak oluşturur."
          disabled={data.students.length === 0}
        >
          <input type="hidden" name="export_type" value="student_pdf" />
          <SelectField name="scope_id" label="Öğrenci" options={data.students.map((student) => ({ value: student.id, label: student.full_name }))} />
        </ExportCard>

        <ExportCard
          icon={Archive}
          title="Dönem Arşivleri"
          description="Kapalı dönemdeki tüm öğrenci snapshotlarını CSV olarak oluşturur."
          disabled={!hasClosedTerms}
        >
          <input type="hidden" name="export_type" value="term_csv" />
          <SelectField name="scope_id" label="Kapalı dönem" options={data.closedTerms.map((term) => ({ value: term.id, label: term.name }))} />
        </ExportCard>

        <ExportCard
          icon={Landmark}
          title="Bölüm Arşivleri"
          description="Kapalı dönem için bölüm bazlı snapshot CSV çıktısı."
          disabled={!hasClosedTerms || data.departments.length === 0}
        >
          <input type="hidden" name="export_type" value="department_csv" />
          <SelectField name="term_id" label="Kapalı dönem" options={data.closedTerms.map((term) => ({ value: term.id, label: term.name }))} />
          <SelectField name="scope_id" label="Bölüm" options={data.departments.map((department) => ({ value: department.id, label: department.name }))} />
        </ExportCard>

        <ExportCard
          icon={School}
          title="Sınıf Arşivleri"
          description="Kapalı dönem için sınıf bazlı snapshot CSV çıktısı."
          disabled={!hasClosedTerms || data.classes.length === 0}
        >
          <input type="hidden" name="export_type" value="class_csv" />
          <SelectField name="term_id" label="Kapalı dönem" options={data.closedTerms.map((term) => ({ value: term.id, label: term.name }))} />
          <SelectField name="scope_id" label="Sınıf" options={data.classes.map((classRow) => ({ value: classRow.id, label: classRow.name }))} />
        </ExportCard>
      </section>

      <ArchiveExportsTable exports={data.exports} />
    </div>
  );
}

function ExportCard({
  icon: Icon,
  title,
  description,
  disabled,
  children,
}: {
  icon: typeof Archive;
  title: string;
  description: string;
  disabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <Icon className="size-5 text-[#093657]" aria-hidden="true" />
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={createArchiveExportAction} className="space-y-3">
          {children}
          <button type="submit" disabled={disabled} className={cn(buttonVariants(), "w-full")}>
            Export Oluştur
          </button>
        </form>
      </CardContent>
    </Card>
  );
}

function SelectField({ name, label, options }: { name: string; label: string; options: Array<{ value: string; label: string }> }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium">
      {label}
      <select name={name} required className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal">
        {options.length > 0 ? (
          options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))
        ) : (
          <option value="">Kayıt yok</option>
        )}
      </select>
    </label>
  );
}

function ArchiveExportsTable({ exports }: { exports: ArchiveExportWithCreator[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Export Geçmişi</CardTitle>
        <CardDescription>Son 50 arşiv export talebi ve indirme durumu.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dosya adı</TableHead>
              <TableHead>Tür</TableHead>
              <TableHead>Oluşturan</TableHead>
              <TableHead>Tarih</TableHead>
              <TableHead>Boyut</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Hata</TableHead>
              <TableHead className="text-right">İndirme</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exports.length > 0 ? (
              exports.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-[#093657]">{item.file_name ?? "-"}</TableCell>
                  <TableCell>{exportTypeLabel(item.export_type)}</TableCell>
                  <TableCell>{item.createdByProfile?.full_name ?? "-"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDateTime(item.created_at)}</TableCell>
                  <TableCell>{formatFileSize(item.file_size)}</TableCell>
                  <TableCell>
                    <StatusBadge status={item.status} />
                  </TableCell>
                  <TableCell className="max-w-56 truncate text-xs text-muted-foreground">{item.error_message ?? "-"}</TableCell>
                  <TableCell className="text-right">
                    {item.status === "completed" ? (
                      <form action={downloadArchiveExportAction}>
                        <input type="hidden" name="export_id" value={item.id} />
                        <button type="submit" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                          <Download className="size-3.5" aria-hidden="true" />
                          İndir
                        </button>
                      </form>
                    ) : (
                      <span className="text-xs text-muted-foreground">Hazır değil</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-sm text-muted-foreground">
                  Henüz export talebi oluşturulmadı.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: ArchiveExportWithCreator["status"] }) {
  const variant = status === "failed" ? "destructive" : status === "completed" ? "default" : "outline";
  return <Badge variant={variant}>{status}</Badge>;
}

function exportTypeLabel(type: ArchiveExportWithCreator["export_type"]) {
  const labels: Record<ArchiveExportWithCreator["export_type"], string> = {
    student_pdf: "Öğrenci PDF",
    term_csv: "Dönem CSV",
    department_csv: "Bölüm CSV",
    class_csv: "Sınıf CSV",
  };

  return (
    <span className="inline-flex items-center gap-1.5">
      {type === "student_pdf" ? <FileText className="size-3.5" aria-hidden="true" /> : <FileSpreadsheet className="size-3.5" aria-hidden="true" />}
      {labels[type]}
    </span>
  );
}

function formatDateTime(value: string | null) {
  return value ? new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "-";
}

function formatFileSize(value: number | null) {
  if (!value) return "-";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}
