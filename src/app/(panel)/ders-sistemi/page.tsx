import Link from "next/link";
import { Plus, BookOpen } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth";
import { getDersSistemiCourses } from "@/lib/ders-sistemi/queries";
import { cn } from "@/lib/utils";

type Props = {
  searchParams: Promise<{ error?: string; success?: string }>;
};

export default async function DersSistemiPage({ searchParams }: Props) {
  const params = await searchParams;
  const { profile } = await requireAuth();
  const courses = await getDersSistemiCourses(profile);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <PageHeader eyebrow="Ders Sistemi" title="Ders Yönetimi" description="Dersleri oluşturun, sınıflara atayın ve hocaları belirleyin." />
        <Link href="/ders-sistemi/yeni" className={cn(buttonVariants())}>
          <Plus className="mr-1.5 size-4" /> Yeni Ders
        </Link>
      </div>
      {params.success ? (
        <div className="rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary">Ders başarıyla oluşturuldu.</div>
      ) : null}
      {params.error ? (
        <div className="rounded-md border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-600">Bir hata oluştu.</div>
      ) : null}
      {courses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Henüz ders oluşturulmamış.</p>
            <Link href="/ders-sistemi/yeni" className={cn(buttonVariants({ variant: "outline" }), "mt-4")}>
              İlk Dersi Oluştur
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {courses.map((course) => (
            <Card key={course.id} className="bg-white">
              <CardHeader className="border-b border-border pb-3">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <CardTitle className="text-base">{course.name}</CardTitle>
                    <p className="mt-0.5 text-sm text-muted-foreground">{course.department?.name ?? "-"}</p>
                  </div>
                  <Badge variant={course.is_active ? "default" : "outline"}>{course.is_active ? "Aktif" : "Pasif"}</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {course.assignments.length > 0 ? (
                  <div className="space-y-2">
                    {course.assignments.map((assignment) => (
                      <div key={assignment.id} className="flex items-center justify-between rounded-md border border-border bg-[#f8fafc] px-3 py-2">
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
                        <div className="flex items-center gap-2 shrink-0">
                          <Link
                            href={`/egitim-planlama/ders-programi/${assignment.class_id}`}
                            className="text-xs text-[#093657] hover:underline"
                          >
                            Program
                          </Link>
                          <Badge variant={assignment.is_active ? "outline" : "secondary"} className="text-[10px]">
                            {assignment.is_active ? "Aktif" : "Pasif"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Bu ders henüz hiçbir sınıfa atanmamış.</p>
                )}
                <div className="mt-3 flex items-center gap-2">
                  <Link
                    href={`/ders-sistemi/${course.id}/kitaplar`}
                    className="flex items-center gap-1 text-xs font-medium text-[#093657] hover:underline"
                  >
                    <BookOpen className="size-3" /> Kitaplar
                  </Link>
                  <span className="text-muted-foreground">·</span>
                  <Link
                    href={`/ders-sistemi/${course.id}/duzenle`}
                    className="text-xs font-medium text-[#093657] hover:underline"
                  >
                    Düzenle
                  </Link>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">{course.assignments.length} sınıf</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
