import { BookOpen, HeartPulse, MessageSquareText, TrendingUp } from "lucide-react";

import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { addStudentBookAction, addStudentProfileNoteAction } from "@/lib/student-profile/actions";
import type { EvaluationWithRelations } from "@/lib/evaluations/queries";
import type { StudentGradeSummary } from "@/lib/grades/queries";
import type { StudentWithRelations } from "@/lib/students/queries";
import type { StudentBookWithRelations, StudentProfileNoteWithRelations } from "@/lib/student-profile/queries";
import type { InfirmaryRecordRow, ProfileRow } from "@/types/database";
import { StudentAvatar } from "@/components/students/student-avatar";
import { StudentProfilePdfSummary } from "@/components/students/student-profile-pdf-summary";
import { StudentProfilePdfButton } from "@/components/students/student-profile-pdf-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type InfirmaryRecord = InfirmaryRecordRow & { created_by_profile: ProfileRow | null };

export function StudentProfileOverview({
  student,
  gradeSummary,
  evaluations,
  infirmaryRecords,
  notes,
  books,
  canEdit,
}: {
  student: StudentWithRelations;
  gradeSummary: StudentGradeSummary | null;
  evaluations: EvaluationWithRelations[];
  infirmaryRecords: InfirmaryRecord[];
  notes: StudentProfileNoteWithRelations[];
  books: StudentBookWithRelations[];
  canEdit: boolean;
}) {
  const latestEvaluation = evaluations[0] ?? null;
  const latestInfirmary = infirmaryRecords[0] ?? null;
  const terms = gradeSummary?.terms ?? [];
  const defaultTermId = terms.find((term) => term.is_current && term.is_active)?.id ?? terms[0]?.id ?? "";

  return (
    <div className="student-profile-print-area space-y-4">
      <div className="hidden print:block">
        <StudentProfilePdfSummary
          student={student}
          gradeSummary={gradeSummary}
          evaluations={evaluations}
          notes={notes}
          compact
        />
      </div>

      <div className="space-y-4 print:hidden">
      <Card className="bg-white">
        <CardContent className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.6fr)]">
          <div className="flex items-start gap-4">
            <StudentAvatar name={student.full_name} photoUrl={student.photo_url} size="lg" previewable />
            <div className="min-w-0">
              <p className="text-sm font-medium text-muted-foreground">{student.department?.name ?? "Bölüm yok"}</p>
              <h2 className="truncate text-2xl font-semibold text-[#093657]">{student.full_name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {student.course_class?.name ?? "Sınıf yok"} · {student.guardian_phone ?? "Veli telefonu yok"}
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-end">
              <StudentProfilePdfButton fileName={`${student.full_name} öğrenci profili`} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Metric icon={TrendingUp} label="Genel Ortalama" value={formatAverage(gradeSummary?.generalAverage ?? null)} />
              <Metric icon={MessageSquareText} label="Hoca Yorumu" value={notes.length.toString()} />
              <Metric icon={HeartPulse} label="Revir Kaydı" value={infirmaryRecords.length.toString()} />
              <Metric icon={BookOpen} label="Okunan Kitap" value={books.length.toString()} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader className="border-b border-border">
            <CardTitle>Not Özeti</CardTitle>
            <CardDescription>Seçili/aktif dönemde girilen ders notları ve ortalamalar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            {gradeSummary && gradeSummary.courseSummaries.length > 0 ? (
              gradeSummary.courseSummaries.map((course) => (
                <div key={course.courseId} className="rounded-md border border-border bg-[#f8fafc] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{course.courseName}</p>
                    <Badge variant="outline">Ortalama {formatAverage(course.average)}</Badge>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-5">
                    {course.examGrades.map((exam) => (
                      <div key={exam.examTypeId} className="rounded-md border border-border bg-white p-2">
                        <p className="truncate text-xs text-muted-foreground">{exam.examTypeName}</p>
                        <p className="mt-1 text-base font-semibold text-[#093657]">{exam.grade ?? "-"}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <EmptyState title="Bu talebe için not verisi bulunamadı." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border">
            <CardTitle>Dönem İçi Yorumlar</CardTitle>
            <CardDescription>Hoca ve bölüm müdürü tarafından eklenen profil notları.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            {canEdit ? <StudentProfileNoteForm studentId={student.id} terms={terms} defaultTermId={defaultTermId} /> : null}
            {notes.length > 0 ? (
              notes.map((note) => (
                <div key={note.id} className="rounded-md border border-border bg-[#f8fafc] p-3">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-medium">{note.creator?.full_name ?? "Profil yok"}</p>
                    <p className="text-xs text-muted-foreground">{note.term?.name ?? "Dönem yok"} · {formatDate(note.created_at)}</p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{note.note}</p>
                </div>
              ))
            ) : (
              <EmptyState title="Henüz dönem içi yorum eklenmedi." />
            )}
            {latestEvaluation?.general_opinion ? (
              <div className="rounded-md border border-border bg-white p-3">
                <p className="text-xs font-medium text-muted-foreground">Son kanaat özeti</p>
                <p className="mt-2 text-sm leading-6">{latestEvaluation.general_opinion}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader className="border-b border-border">
            <CardTitle>Revir Geçmişi</CardTitle>
            <CardDescription>Revir sisteminden çekilen son sağlık kayıtları.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            {latestInfirmary ? (
              <div className="rounded-md border border-border bg-[#f8fafc] p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{latestInfirmary.record_date}</p>
                  <Badge variant={latestInfirmary.parent_informed ? "default" : "outline"}>
                    {latestInfirmary.parent_informed ? "Veli bilgilendirildi" : "Veli bilgilendirilmedi"}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">Şikayet: {latestInfirmary.complaint ?? "-"}</p>
                <p className="mt-1 text-sm text-muted-foreground">Tedavi: {latestInfirmary.treatment ?? "-"}</p>
              </div>
            ) : (
              <EmptyState title="Revir kaydı bulunamadı." />
            )}
            {infirmaryRecords.slice(1, 4).map((record) => (
              <div key={record.id} className="flex items-center justify-between gap-3 rounded-md border border-border bg-white p-3">
                <div className="min-w-0">
                  <p className="font-medium">{record.record_date}</p>
                  <p className="truncate text-sm text-muted-foreground">{record.complaint ?? record.note ?? "Açıklama yok"}</p>
                </div>
                <Badge variant="outline">{record.sent_to_hospital ? "Sevk" : "Revir"}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border">
            <CardTitle>Okuduğu Kitaplar</CardTitle>
            <CardDescription>Dönem içinde takip edilen kitap kayıtları.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            {canEdit ? <StudentBookForm studentId={student.id} terms={terms} defaultTermId={defaultTermId} /> : null}
            {books.length > 0 ? (
              books.map((book) => (
                <div key={book.id} className="rounded-md border border-border bg-[#f8fafc] p-3">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-medium">{book.title}</p>
                    <p className="text-xs text-muted-foreground">{book.term?.name ?? "Dönem yok"} · {book.read_date ? formatDate(book.read_date) : "Tarih yok"}</p>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{book.author ?? "Yazar belirtilmedi"}</p>
                  {book.note ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{book.note}</p> : null}
                </div>
              ))
            ) : (
              <EmptyState title="Henüz kitap kaydı eklenmedi." />
            )}
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}

function StudentProfileNoteForm({
  studentId,
  terms,
  defaultTermId,
}: {
  studentId: string;
  terms: Array<{ id: string; name: string; is_active: boolean }>;
  defaultTermId: string;
}) {
  return (
    <form action={addStudentProfileNoteAction} className="student-profile-print-hidden space-y-3 rounded-md border border-border bg-white p-3">
      <input type="hidden" name="student_id" value={studentId} />
      <div className="grid gap-3 sm:grid-cols-[180px_minmax(0,1fr)]">
        <select name="term_id" defaultValue={defaultTermId} className="h-9 rounded-md border border-border bg-background px-3 text-sm">
          <option value="">Dönem yok</option>
          {terms.map((term) => <option key={term.id} value={term.id}>{term.name}</option>)}
        </select>
        <Textarea name="note" required minLength={3} placeholder="Dönem içi gözlem, davranış veya akademik takip notu" className="min-h-20" />
      </div>
      <div className="flex justify-end">
        <FormSubmitButton pendingLabel="Kaydediliyor..." size="sm">Yorum Ekle</FormSubmitButton>
      </div>
    </form>
  );
}

function StudentBookForm({
  studentId,
  terms,
  defaultTermId,
}: {
  studentId: string;
  terms: Array<{ id: string; name: string; is_active: boolean }>;
  defaultTermId: string;
}) {
  return (
    <form action={addStudentBookAction} className="student-profile-print-hidden space-y-3 rounded-md border border-border bg-white p-3">
      <input type="hidden" name="student_id" value={studentId} />
      <div className="grid gap-3 md:grid-cols-2">
        <Input name="title" required placeholder="Kitap adı" />
        <Input name="author" placeholder="Yazar" />
        <select name="term_id" defaultValue={defaultTermId} className="h-9 rounded-md border border-border bg-background px-3 text-sm">
          <option value="">Dönem yok</option>
          {terms.map((term) => <option key={term.id} value={term.id}>{term.name}</option>)}
        </select>
        <Input name="read_date" type="date" />
      </div>
      <Textarea name="note" placeholder="Kitapla ilgili kısa not" />
      <div className="flex justify-end">
        <FormSubmitButton pendingLabel="Kaydediliyor..." size="sm">Kitap Ekle</FormSubmitButton>
      </div>
    </form>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof TrendingUp; label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-[#f8fafc] p-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" aria-hidden />
        <p className="text-xs font-medium">{label}</p>
      </div>
      <p className="mt-2 text-2xl font-semibold text-[#093657]">{value}</p>
    </div>
  );
}

function formatAverage(value: number | null) {
  return value === null ? "-" : value.toFixed(2);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(new Date(value));
}
