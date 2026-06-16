import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, BookOpen } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { CourseBookList } from "@/components/course-books/course-book-list";
import { buttonVariants } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth";
import { canManageCourseBooks, canViewCourseBooks } from "@/lib/course-books/permissions";
import { getCourseBooksWithProgress, getClassesForCourse } from "@/lib/course-books/queries";
import { getCourseById } from "@/lib/courses/queries";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
};

export default async function CourseBooksPage({ params, searchParams }: Props) {
  const { id: courseId } = await params;
  const search = await searchParams;
  const { profile } = await requireAuth();

  const course = await getCourseById(courseId);

  if (!course) {
    redirect("/ders-sistemi");
  }

  if (!canViewCourseBooks(profile, course.department_id)) {
    redirect("/ders-sistemi?error=unauthorized");
  }

  const canManage = canManageCourseBooks(profile, course.department_id);

  const books = await getCourseBooksWithProgress(courseId);
  const classes = await getClassesForCourse(courseId);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/ders-sistemi" className={buttonVariants({ variant: "ghost", size: "icon" })}>
          <ArrowLeft className="size-4" />
        </Link>
        <PageHeader
          eyebrow="Ders Sistemi"
          title={`${course.name} - Kitaplar`}
          description="Ders kitaplarını yönetin ve sınıf ilerlemelerini takip edin."
        />
      </div>

      {search.success === "book-created" && (
        <div className="rounded-md border border-green-400/40 bg-green-500/10 px-3 py-2 text-sm text-green-700">
          Kitap başarıyla eklendi.
        </div>
      )}
      {search.success === "book-updated" && (
        <div className="rounded-md border border-green-400/40 bg-green-500/10 px-3 py-2 text-sm text-green-700">
          Kitap başarıyla güncellendi.
        </div>
      )}
      {search.success === "book-deleted" && (
        <div className="rounded-md border border-green-400/40 bg-green-500/10 px-3 py-2 text-sm text-green-700">
          Kitap başarıyla silindi.
        </div>
      )}
      {search.error && (
        <div className="rounded-md border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-700">
          {search.error}
        </div>
      )}

      {canManage ? (
        <CourseBookList books={books} courseId={courseId} classes={classes} />
      ) : (
        <div className="rounded-md border border-yellow-400/40 bg-yellow-500/10 px-3 py-2 text-sm text-yellow-700">
          Kitap yönetimi için yetkiniz yok. Sadece görüntüleme yapabilirsiniz.
        </div>
      )}

      {books.length === 0 && !canManage && (
        <div className="rounded-md border border-border bg-muted/50 px-3 py-8 text-center">
          <BookOpen className="mx-auto mb-2 size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Bu derse henüz kitap eklenmemiş.</p>
        </div>
      )}
    </div>
  );
}