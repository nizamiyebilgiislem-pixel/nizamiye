import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, BookOpen, ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireAuth } from "@/lib/auth";
import { getDersSistemiEditData } from "@/lib/ders-sistemi/queries";
import { getCourseBooks } from "@/lib/course-books/queries";
import { cn } from "@/lib/utils";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CourseDetailPage({ params }: Props) {
  const { id } = await params;
  const { profile } = await requireAuth();

  const editData = await getDersSistemiEditData(profile, id);

  if (!editData) {
    notFound();
  }

  const { course } = editData;
  const books = await getCourseBooks(id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/ders-sistemi" className={buttonVariants({ variant: "ghost", size: "icon" })}>
          <ArrowLeft className="size-4" />
        </Link>
        <PageHeader
          eyebrow="Ders Sistemi"
          title={course.name}
          description={course.department?.name ?? "-"}
          actions={
            <div className="flex gap-2">
              <Link href={`/ders-sistemi/${course.id}/kitaplar`} className={cn(buttonVariants({ variant: "outline" }))}>
                <BookOpen className="mr-1.5 size-4" /> Kitaplar
              </Link>
              <Link href={`/ders-sistemi/${course.id}/duzenle`} className={cn(buttonVariants())}>
                <Pencil className="mr-1.5 size-4" /> Düzenle
              </Link>
            </div>
          }
        />
      </div>

      <Card className="bg-white">
        <CardHeader className="border-b border-border">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Ders Bilgi Kartı</CardTitle>
              <CardDescription>Ders detayları ve durumu.</CardDescription>
            </div>
            <Badge variant={course.is_active ? "default" : "outline"}>{course.is_active ? "Aktif" : "Pasif"}</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 p-4 md:grid-cols-3">
          <Info label="Bölüm" value={course.department?.name ?? "-"} />
          <Info label="Sınıf Sayısı" value={String(course.assignments.length)} />
          <Info label="Kitap Sayısı" value={String(books.length)} />
        </CardContent>
      </Card>

      <section className="space-y-4">
        <PageHeader
          eyebrow="Sınıf Atamaları"
          title="Atanan Sınıflar"
          description="Dersin atandığı sınıflar ve hocalar."
        />
        {course.assignments.length > 0 ? (
          <div className="space-y-3">
            {course.assignments.map((assignment) => (
              <Card key={assignment.id} className="bg-white">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="min-w-0">
                    <Link href={`/siniflar/${assignment.class_id}`} className="text-sm font-medium text-[#093657] hover:underline">
                      {assignment.class_name}
                    </Link>
                    {assignment.teacher ? (
                      <Link href={`/hocalar/${assignment.teacher.id}`} className="ml-3 text-xs text-muted-foreground hover:underline">
                        {assignment.teacher.full_name}
                      </Link>
                    ) : (
                      <span className="ml-3 text-xs text-muted-foreground">Hoca atanmadı</span>
                    )}
                  </div>
                  <Badge variant={assignment.is_active ? "outline" : "secondary"} className="text-[10px]">
                    {assignment.is_active ? "Aktif" : "Pasif"}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState title="Bu ders henüz hiçbir sınıfa atanmamış." />
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <PageHeader
            eyebrow="Ders Kitapları"
            title="Kitaplar"
            description="Derse ait kitap listesi."
          />
          <Link href={`/ders-sistemi/${course.id}/kitaplar`} className={cn(buttonVariants({ variant: "outline" }))}>
            <BookOpen className="mr-1.5 size-4" /> Kitapları Yönet
          </Link>
        </div>
        {books.length > 0 ? (
          <div className="space-y-2">
            {books.map((book) => (
              <Card key={book.id} className="bg-white">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-medium">{book.title}</p>
                    {book.author && <p className="text-xs text-muted-foreground">{book.author}</p>}
                  </div>
                  <Badge variant={book.is_active ? "default" : "outline"}>{book.is_active ? "Aktif" : "Pasif"}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState icon={BookOpen} title="Bu derse henüz kitap eklenmemiş." />
        )}
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-[#f8fafc] p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-base font-semibold text-[#093657]">{value}</p>
    </div>
  );
}
