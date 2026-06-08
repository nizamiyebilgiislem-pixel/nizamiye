import { notFound, redirect } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { ParentErrorMessage } from "@/components/parents/parent-error-message";
import { ParentLinkManager } from "@/components/parents/parent-link-manager";
import { requireAuth } from "@/lib/auth";
import {
  addParentStudentLinkAction,
  removeParentStudentLinkAction,
} from "@/lib/parents/actions";
import { canManageParentLinks } from "@/lib/parents/permissions";
import {
  getParentProfileByIdForProfile,
  getVisibleStudentsForParentManagement,
} from "@/lib/parents/queries";

type ParentStudentsPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
};

export default async function ParentStudentsPage({ params, searchParams }: ParentStudentsPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { profile } = await requireAuth();
  const parent = await getParentProfileByIdForProfile(profile, id);

  if (!parent) {
    notFound();
  }

  if (!canManageParentLinks(profile, parent.linked_students.length)) {
    redirect(`/veliler/${id}?error=unauthorized`);
  }

  const visibleStudents = await getVisibleStudentsForParentManagement(profile);
  const linkedStudentIds = new Set(parent.linked_students.map((student) => student.id));
  const availableStudents = visibleStudents.filter((student) => !linkedStudentIds.has(student.id));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Veliler"
        title={`${parent.full_name} · Talebeler`}
        description="Veli-talebe ilişkilerini burada yönetin."
      />
      <ParentErrorMessage error={query.error} />
      {query.success ? <SuccessMessage success={query.success} /> : null}
      <ParentLinkManager
        parent={parent}
        availableStudents={availableStudents}
        addAction={addParentStudentLinkAction}
        removeAction={removeParentStudentLinkAction}
      />
    </div>
  );
}

function SuccessMessage({ success }: { success: string }) {
  const messages: Record<string, string> = {
    "student-linked": "Talebe bağlantısı oluşturuldu.",
    "student-unlinked": "Talebe bağlantısı kaldırıldı.",
  };

  return <div className="rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary">{messages[success] ?? success}</div>;
}
