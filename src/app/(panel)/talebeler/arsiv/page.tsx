import { PageHeader } from "@/components/layout/page-header";
import { StudentEmptyState } from "@/components/students/student-empty-state";
import { StudentErrorMessage } from "@/components/students/student-error-message";
import { StudentFilters } from "@/components/students/student-filters";
import { StudentListTable } from "@/components/students/student-list-table";
import { reactivateStudentAction } from "@/lib/students/actions";
import { canReactivateArchivedStudent } from "@/lib/students/permissions";
import { getStudentsForProfile } from "@/lib/students/queries";
import { requireRole } from "@/lib/auth";

type ArchivedStudentsPageProps = {
  searchParams: Promise<{
    q?: string;
    department?: string;
    class?: string;
    error?: string;
  }>;
};

export default async function ArchivedStudentsPage({ searchParams }: ArchivedStudentsPageProps) {
  const params = await searchParams;
  const { profile } = await requireRole(["admin", "genel_mudur", "bolum_muduru"]);
  const { students, departments, classes } = await getStudentsForProfile(profile, {
    search: params.q,
    departmentId: params.department,
    classId: params.class,
    archived: true,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Talebeler"
        title="Arşiv Talebeler"
        description="Pasif, mezun ve ayrıldı durumundaki talebe kayıtları."
      />
      <StudentErrorMessage error={params.error} />
      <StudentFilters
        actionPath="/talebeler/arsiv"
        departments={departments}
        classes={classes}
        values={{ search: params.q, departmentId: params.department, classId: params.class }}
      />
      {students.length > 0 ? (
        <StudentListTable
          students={students}
          profile={profile}
          showReactivate={canReactivateArchivedStudent(profile)}
          reactivateAction={reactivateStudentAction}
        />
      ) : (
        <StudentEmptyState title="Arşiv kaydı bulunamadı" description="Seçili filtrelerle eşleşen arşiv talebesi yok." />
      )}
    </div>
  );
}
