import Link from "next/link";
import { Plus } from "lucide-react";

import { CourseFilters } from "@/components/courses/course-filters";
import { CourseList } from "@/components/courses/course-list";
import { GradeErrorMessage } from "@/components/grades/grade-error-message";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireAuth } from "@/lib/auth";
import { getCoursesForProfile } from "@/lib/courses/queries";
import { canManageGradeSettings } from "@/lib/grades/permissions";
import { cn } from "@/lib/utils";

type CoursesPageProps = {
  searchParams: Promise<{ q?: string; department?: string; status?: string; error?: string }>;
};

export default async function CoursesPage({ searchParams }: CoursesPageProps) {
  const params = await searchParams;
  const { profile } = await requireAuth();
  const { courses, departments } = await getCoursesForProfile(profile, {
    search: params.q,
    departmentId: params.department,
    status: params.status,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Not Sistemi"
        title="Dersler"
        description="Bölüm bazlı dersleri ve sınav türlerini yönetin."
        actions={canManageGradeSettings(profile) ? <Link href="/not-sistemi/dersler/yeni" className={cn(buttonVariants())}><Plus className="size-4" aria-hidden="true" />Yeni Ders</Link> : undefined}
      />
      <GradeErrorMessage error={params.error} />
      <CourseFilters departments={departments} values={{ search: params.q, departmentId: params.department, status: params.status }} />
      {courses.length > 0 ? <CourseList courses={courses} profile={profile} /> : <EmptyState title="Ders bulunamadı." />}
    </div>
  );
}
