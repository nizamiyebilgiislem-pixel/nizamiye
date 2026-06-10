import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Pencil } from "lucide-react";

import { StudentDocumentSummary } from "@/components/documents/student-document-summary";
import { EvaluationSummary } from "@/components/evaluations/evaluation-summary";
import { GradeSummary } from "@/components/grades/grade-summary";
import { AuditTimeline } from "@/components/audit/audit-timeline";
import { StudentAttendanceSummaryPanel } from "@/components/attendance/student-attendance-summary";
import { StudentDormitoryPanel } from "@/components/dormitory/student-dormitory-panel";
import { StudentLibraryPanel } from "@/components/library/student-library-panel";
import { StudentGuidancePanel } from "@/components/guidance/student-guidance-panel";
import { StudentInfirmarySummary } from "@/components/infirmary/infirmary-summary";
import { PageHeader } from "@/components/layout/page-header";
import { StudentParentsCard } from "@/components/parents/student-parents-card";
import { StudentAvatar } from "@/components/students/student-avatar";
import { StudentErrorMessage } from "@/components/students/student-error-message";
import { StudentProfileOverview } from "@/components/students/student-profile-overview";
import { StudentTermHistoryPanel } from "@/components/students/student-term-history-panel";
import { StatusBadge } from "@/components/students/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireAuth } from "@/lib/auth";
import { getDocumentsByStudent } from "@/lib/documents/queries";
import { canEditStudentDocuments } from "@/lib/documents/permissions";
import { getStudentActiveAssignment, getStudentAssignmentHistory } from "@/lib/dormitory/queries";
import { canViewDormitoryForStudents } from "@/lib/dormitory/permissions";
import { getStudentLoans } from "@/lib/library/queries";
import { canViewLibrary } from "@/lib/library/permissions";
import { canViewGuidance } from "@/lib/guidance/permissions";
import { canViewGuidanceForStudent } from "@/lib/guidance/scope";
import { getEvaluationsByStudent } from "@/lib/evaluations/queries";
import { canEditStudentEvaluations } from "@/lib/evaluations/permissions";
import { getStudentGradeSummary } from "@/lib/grades/queries";
import { canEditStudentGrades } from "@/lib/grades/permissions";
import { getInfirmaryRecordsByStudent } from "@/lib/infirmary/queries";
import { canEditInfirmaryRecord } from "@/lib/infirmary/permissions";
import { canManageInfirmary } from "@/lib/module-assignments/permissions";
import { getAttendanceStudentSummary } from "@/lib/attendance/queries";
import { linkExistingParentToStudentAction } from "@/lib/parents/actions";
import { canBindParentFromStudentDetail } from "@/lib/parents/permissions";
import { getParentProfilesByStudentId, getParentSelectionOptionsForStudent } from "@/lib/parents/queries";
import { getStudentAuditLogs } from "@/lib/audit/queries";
import { getStudentProfileEntries } from "@/lib/student-profile/queries";
import { canManageStudentProfileEntries } from "@/lib/student-profile/permissions";
import { getStudentTermSnapshots } from "@/lib/terms/queries";
import { canEditStudent, canViewStudent } from "@/lib/students/permissions";
import { getStudentById } from "@/lib/students/queries";
import { cn } from "@/lib/utils";

type StudentDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; term?: string; profileSaved?: string; success?: string }>;
};

export default async function StudentDetailPage({ params, searchParams }: StudentDetailPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { profile } = await requireAuth();
  const student = await getStudentById(id);

  if (!student) {
    notFound();
  }

  if (!canViewStudent(profile, student.course_class)) {
    redirect("/talebeler?error=unauthorized");
  }

  const editable = canEditStudent(profile, student, student.course_class);
  const gradeSummary = student.course_class ? await getStudentGradeSummary(profile, student, query.term) : null;
  const canEditGrades = student.course_class ? canEditStudentGrades(profile, student, student.course_class, gradeSummary?.classCourses ?? []) : false;
  const evaluations = await getEvaluationsByStudent(student.id);
  const canEditEvaluations = student.course_class ? canEditStudentEvaluations(profile, student, student.course_class) : false;
  const infirmaryRecords = await getInfirmaryRecordsByStudent(student.id);
  const canEditInfirmary = (student.course_class ? canEditInfirmaryRecord(profile, student, student.course_class) : false) || await canManageInfirmary(profile);
  const documents = await getDocumentsByStudent(student.id);
  const canEditDocuments = student.course_class ? canEditStudentDocuments(profile, student, student.course_class) : false;
  const auditLogs = await getStudentAuditLogs(profile, student.id);
  const attendanceSummary = await getAttendanceStudentSummary(profile, student.id);
  const profileEntries = await getStudentProfileEntries(student.id);
  const canEditProfileEntries = canManageStudentProfileEntries(profile, student.course_class);
  const linkedParents = await getParentProfilesByStudentId(profile, student.id);
  const canManageParents = canBindParentFromStudentDetail(profile);
  const availableParents = canManageParents ? await getParentSelectionOptionsForStudent(profile, student.id) : [];
  const termSnapshots = await getStudentTermSnapshots(student.id);
  const canViewDormitory = canViewDormitoryForStudents(profile, student.department?.id ?? null);
  const dormitoryAssignment = canViewDormitory ? await getStudentActiveAssignment(student.id) : null;
  const dormitoryHistory = canViewDormitory ? await getStudentAssignmentHistory(student.id) : [];
  const canViewLib = canViewLibrary(profile);
  const studentLoans = canViewLib ? await getStudentLoans(student.id) : [];
  const canViewGuid = canViewGuidance(profile) && await canViewGuidanceForStudent(profile, { course_class_id: student.course_class?.id ?? null, department_id: student.department?.id ?? null });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-start gap-4">
          <StudentAvatar name={student.full_name} photoUrl={student.photo_url} size="lg" previewable />
          <PageHeader
            eyebrow={student.department?.name ?? "Talebe"}
            title={student.full_name}
            description={`${student.guardian_phone ?? "Veli telefonu yok"}`}
          />
          {student.course_class?.id ? (
            <Link
              href={`/siniflar/${student.course_class.id}`}
              className="text-sm font-medium text-[#093657] hover:underline"
            >
              {student.course_class.name}
            </Link>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={student.status} />
          {editable ? (
            <Link href={`/talebeler/${student.id}/duzenle`} className={cn(buttonVariants())}>
              <Pencil className="size-4" aria-hidden="true" />
              Düzenle
            </Link>
          ) : null}
        </div>
      </div>

      <StudentErrorMessage error={query.error} />
      {query.profileSaved ? (
        <div className="rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary">
          {query.profileSaved === "book" ? "Kitap kaydı eklendi." : "Profil yorumu eklendi."}
        </div>
      ) : null}
      {query.success ? <SuccessMessage success={query.success} /> : null}

      <div className="flex flex-wrap gap-2">
        <Link href={`/talebeler/${student.id}/pdf`} target="_blank" rel="noreferrer" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          Bilgi Formu PDF
        </Link>
        <Link href={`/talebeler/${student.id}/notlar/pdf`} target="_blank" rel="noreferrer" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          Not Dökümü PDF
        </Link>
        <Link href={`/talebeler/${student.id}/kanaat/pdf`} target="_blank" rel="noreferrer" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          Kanaat PDF
        </Link>
        <Link href={`/talebeler/${student.id}/revir/pdf`} target="_blank" rel="noreferrer" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          Revir PDF
        </Link>
      </div>

      <Tabs defaultValue="profil" className="space-y-4">
        <TabsList className="max-w-full flex-wrap justify-start">
          <TabsTrigger value="profil">Profil</TabsTrigger>
          <TabsTrigger value="genel">Genel Bilgiler</TabsTrigger>
          <TabsTrigger value="aile">Aile Bilgileri</TabsTrigger>
          <TabsTrigger value="veliler">Veliler</TabsTrigger>
          <TabsTrigger value="egitim">Eğitim Bilgileri</TabsTrigger>
          <TabsTrigger value="notlar">Notlar</TabsTrigger>
          <TabsTrigger value="kanaatler">Kanaatler</TabsTrigger>
          <TabsTrigger value="revir">Revir</TabsTrigger>
          <TabsTrigger value="evraklar">Evraklar</TabsTrigger>
          <TabsTrigger value="yoklama">Yoklama</TabsTrigger>
          <TabsTrigger value="yatakhane">Yatakhane</TabsTrigger>
          <TabsTrigger value="kutuphane">Kütüphane</TabsTrigger>
          {canViewGuid && <TabsTrigger value="rehberlik">Rehberlik</TabsTrigger>}
          <TabsTrigger value="donem-gecmisi">Dönem Geçmişi</TabsTrigger>
          <TabsTrigger value="gecmis">Geçmiş</TabsTrigger>
        </TabsList>

        <TabsContent value="profil">
          <StudentProfileOverview
            student={student}
            gradeSummary={gradeSummary}
            evaluations={evaluations}
            infirmaryRecords={infirmaryRecords}
            notes={profileEntries.notes}
            books={profileEntries.books}
            canEdit={canEditProfileEntries}
          />
        </TabsContent>
        <TabsContent value="genel">
          <InfoCard
            title="Genel Bilgiler"
            items={[
              ["Ad Soyad", student.full_name],
              ["TC Kimlik", student.identity_number],
              ["Durum", student.status],
              ["Doğum Tarihi", student.birth_date],
              ["Kayıt Tarihi", student.registration_date],
              ["Kan Grubu", student.blood_type],
              ["Uyruğu", student.nationality],
              ["Memleketi", student.hometown],
              ["Adres", student.address],
            ]}
          />
        </TabsContent>
        <TabsContent value="aile">
          <InfoCard
            title="Aile Bilgileri"
            items={[
              ["Baba Adı", student.father_name],
              ["Anne Adı", student.mother_name],
              ["Veli Telefonu", student.guardian_phone],
              ["İkinci Veli Telefonu", student.guardian_phone_2],
              ["Baba Meslek", student.father_job],
              ["Anne Meslek", student.mother_job],
              ["Baba Durum", student.father_status],
              ["Anne Durum", student.mother_status],
              ["Aylık Ortalama Gelir", student.family_monthly_income],
              ["Ev Durumu", student.home_status],
              ["Baba Anne Durumu", student.parent_marital_status],
              ["Kurumda Okuyan Kardeş", student.sibling_in_institution],
            ]}
          />
        </TabsContent>
        <TabsContent value="veliler">
          <StudentParentsCard
            studentId={student.id}
            parents={linkedParents}
            availableParents={availableParents}
            canManage={canManageParents}
            linkAction={linkExistingParentToStudentAction}
          />
        </TabsContent>
        <TabsContent value="egitim">
          <InfoCard
            title="Eğitim Bilgileri"
            items={[
              ["Bölüm", student.department?.name],
              ["Kurs Sınıfı", student.course_class?.name],
              ["Okul Sınıfı", student.school_class],
              ["Okulu", student.school_name],
            ]}
          />
        </TabsContent>
        <TabsContent value="notlar">
          {gradeSummary ? <GradeSummary summary={gradeSummary} studentId={student.id} canEdit={canEditGrades} /> : <PlaceholderCard />}
        </TabsContent>
        <TabsContent value="kanaatler">
          <EvaluationSummary evaluations={evaluations} studentId={student.id} canEdit={canEditEvaluations} />
        </TabsContent>
        <TabsContent value="revir">
          <StudentInfirmarySummary records={infirmaryRecords} studentId={student.id} canEdit={canEditInfirmary} />
        </TabsContent>
        <TabsContent value="evraklar">
          <StudentDocumentSummary documents={documents} studentId={student.id} canEdit={canEditDocuments} />
        </TabsContent>
        <TabsContent value="yoklama">
          <StudentAttendanceSummaryPanel summary={attendanceSummary} />
        </TabsContent>
        <TabsContent value="yatakhane">
          {canViewDormitory ? (
            <StudentDormitoryPanel activeAssignment={dormitoryAssignment} history={dormitoryHistory} />
          ) : (
            <PlaceholderCard />
          )}
        </TabsContent>
        <TabsContent value="kutuphane">
          {canViewLib ? (
            <StudentLibraryPanel loans={studentLoans} />
          ) : (
            <PlaceholderCard />
          )}
        </TabsContent>
        {canViewGuid && (
          <TabsContent value="rehberlik">
            <StudentGuidancePanel studentId={student.id} profile={profile} />
          </TabsContent>
        )}
        <TabsContent value="donem-gecmisi">
          <StudentTermHistoryPanel snapshots={termSnapshots} />
        </TabsContent>
        <TabsContent value="gecmis">
          <AuditTimeline
            entries={auditLogs}
            emptyText="Bu talebe için henüz işlem geçmişi yok."
            detailBasePath="/audit-log"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SuccessMessage({ success }: { success: string }) {
  const messages: Record<string, string> = {
    "parent-linked": "Veli bağlantısı oluşturuldu.",
  };

  return <div className="rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary">{messages[success] ?? success}</div>;
}

function InfoCard({ title, items }: { title: string; items: Array<[string, string | null | undefined]> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {items.map(([label, value]) => (
          <div key={label} className="rounded-md border border-border bg-background p-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-sm font-medium">{value || "-"}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function PlaceholderCard() {
  return (
    <Card>
      <CardContent className="py-10 text-center text-sm text-muted-foreground">Bu bölüm sonraki fazda aktif edilecek.</CardContent>
    </Card>
  );
}
