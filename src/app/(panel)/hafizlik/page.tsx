import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireAuth } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

type HafizlikDashboardPageProps = {
  params: Promise<{}>;
  searchParams: Promise<{ search?: string }>;
};

export default async function HafizlikDashboardPage({ params, searchParams }: HafizlikDashboardPageProps) {
  const { profile } = await requireAuth();
  const query = await searchParams;

  if (!["admin", "genel_mudur", "bolum_muduru", "hoca"].includes(profile.role)) {
    redirect("/dashboard?error=unauthorized");
  }

  const supabase = await createSupabaseServerClient();

  const { data: hafizlikDepartment } = await supabase
    .from("departments")
    .select("id, name")
    .eq("slug", "hafizlik")
    .single();

  if (!hafizlikDepartment) {
    return (
      <div className="space-y-6">
        <PageHeader title="Hafızlık Takibi" description="Hafızlık bölümü bulunamadı." />
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Hafızlık bölümü sistemde tanımlı değil.
          </CardContent>
        </Card>
      </div>
    );
  }

  const searchTerm = query.search?.toLowerCase() ?? "";

  const { data: allStudents } = await supabase
    .from("students")
    .select(`
      id,
      full_name,
      course_class_id,
      course_class:classes!inner(id, name, department_id, class_teacher_id)
    `)
    .eq("status", "active");

  const hafizlikStudentIds = (allStudents ?? [])
    .filter((s: any) => s.course_class?.department_id === hafizlikDepartment.id)
    .map((s: any) => s.id);

  const { data: allProgress } = hafizlikStudentIds.length > 0
    ? await supabase
        .from("hafizlik_progress")
        .select("*")
        .in("student_id", hafizlikStudentIds)
    : { data: [] };

  const { data: allProfiles } = hafizlikStudentIds.length > 0
    ? await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", (allStudents ?? []).map((s: any) => s.course_class?.class_teacher_id).filter(Boolean))
    : { data: [] };

  const teacherMap = new Map((allProfiles ?? []).map((p: any) => [p.id, p.full_name]));

  const progressMap = new Map((allProgress ?? []).map((p: any) => [p.student_id, p]));

  const filteredStudents = (allStudents ?? []).filter((s: any) => {
    if (s.course_class?.department_id !== hafizlikDepartment.id) return false;
    if (searchTerm && !s.full_name.toLowerCase().includes(searchTerm)) return false;
    return true;
  });

  const studentsWithProgress = filteredStudents.map((student: any) => {
    const progress = progressMap.get(student.id);
    const teacherName = teacherMap.get(student.course_class?.class_teacher_id) ?? null;
    const percentage = progress
      ? Math.round(((progress.current_juz - 1) * 604 + progress.current_page) / 604 * 100)
      : 0;
    return {
      ...student,
      progress,
      teacherName,
      percentage,
    };
  });

  const overdueCount = studentsWithProgress.filter((s: any) => {
    if (!s.progress?.target_completion_date) return false;
    return new Date(s.progress.target_completion_date) < new Date();
  }).length;

  const onTrackCount = studentsWithProgress.filter((s: any) => {
    if (!s.progress) return false;
    return s.progress.status === "completed";
  }).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <PageHeader
          title="Hafızlık Takibi"
          description={`${hafizlikDepartment.name} bölümü öğrencilerinin cüz bazlı ilerleme takibi.`}
        />
        <div className="flex gap-2">
          <Link href="/hafizlik/guncelle" className={buttonVariants()}>
            Toplu Güncelle
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{studentsWithProgress.length}</div>
            <p className="text-sm text-muted-foreground">Toplam Öğrenci</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{onTrackCount}</div>
            <p className="text-sm text-muted-foreground">Tamamlanan</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className={cn("text-2xl font-bold", overdueCount > 0 && "text-red-600")}>
              {overdueCount}
            </div>
            <p className="text-sm text-muted-foreground">Hedef Gecikmiş</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle>Öğrenci Listesi</CardTitle>
            <form className="flex gap-2">
              <Input
                name="search"
                placeholder="Öğrenci ara..."
                defaultValue={query.search ?? ""}
                className="w-48"
              />
              <button type="submit" className={buttonVariants({ variant: "outline" })}>
                Ara
              </button>
            </form>
          </div>
        </CardHeader>
        <CardContent>
          {studentsWithProgress.length > 0 ? (
            <div className="space-y-4">
              {studentsWithProgress.map((student: any) => (
                <div key={student.id} className="flex items-center gap-4 rounded-md border border-border p-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Link href={`/talebeler/${student.id}`} className="font-medium hover:underline">
                        {student.full_name}
                      </Link>
                      <span className="text-sm text-muted-foreground">
                        · {student.course_class?.name}
                      </span>
                    </div>
                    {student.teacherName && (
                      <p className="text-sm text-muted-foreground">Sınıf Hocası: {student.teacherName}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    {student.progress ? (
                      <>
                        <div className="w-32">
                          <div className="flex justify-between text-xs">
                            <span>{student.progress.current_juz}. Cüz</span>
                            <span>{student.percentage}%</span>
                          </div>
                          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${student.percentage}%` }}
                            />
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            student.progress.status === "completed" && "bg-green-100 text-green-800",
                            student.progress.status === "reviewing" && "bg-yellow-100 text-yellow-800",
                            student.progress.status === "learning" && "bg-blue-100 text-blue-800"
                          )}
                        >
                          {student.progress.status === "learning" ? "Öğreniyor" :
                           student.progress.status === "reviewing" ? "Tekrar" : "Tamamlandı"}
                        </Badge>
                        {student.progress.target_completion_date && (
                          <span className={cn(
                            "text-xs",
                            new Date(student.progress.target_completion_date) < new Date() && "text-red-600 font-medium"
                          )}>
                            Hedef: {new Date(student.progress.target_completion_date).toLocaleDateString("tr-TR")}
                          </span>
                        )}
                      </>
                    ) : (
                      <Badge variant="secondary">Kayıt Yok</Badge>
                    )}
                    <Link
                      href={`/talebeler/${student.id}?tab=hafizlik`}
                      className={buttonVariants({ variant: "ghost", size: "sm" })}
                    >
                      Detay
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {searchTerm ? "Arama sonucu bulunamadı." : "Bu bölümde aktif öğrenci bulunmuyor."}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}