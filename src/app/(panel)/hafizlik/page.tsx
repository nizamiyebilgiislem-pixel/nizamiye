import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, Clock } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { getHafizlikDepartmentScope, getHafizlikStudentsByDepartment } from "@/lib/hafizlik/queries";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { NativeSelect } from "@/components/ui/native-select";
import { requireAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

type HafizlikDashboardPageProps = {
  searchParams: Promise<{ search?: string; department?: string }>;
};

export default async function HafizlikDashboardPage({ searchParams }: HafizlikDashboardPageProps) {
  const { profile } = await requireAuth();
  const query = await searchParams;

  if (!["admin", "genel_mudur", "bolum_muduru", "hoca"].includes(profile.role)) {
    redirect("/dashboard?error=unauthorized");
  }

  const scope = await getHafizlikDepartmentScope(profile, query.department);

  if (!scope.selectedDepartment) {
    return (
      <div className="space-y-6">
        <PageHeader title="Hafızlık Takibi" description="Görüntüleyebileceğiniz aktif bölüm bulunamadı." />
        <EmptyState title="Hafızlık takibi için erişilebilir aktif bölüm bulunamadı." />
      </div>
    );
  }

  const searchTerm = query.search?.trim().toLocaleLowerCase("tr-TR") ?? "";
  const studentsWithProgress = (await getHafizlikStudentsByDepartment(scope.selectedDepartment.id, { onlyWithProgress: true }))
    .filter((student) => !searchTerm || student.full_name.toLocaleLowerCase("tr-TR").includes(searchTerm));

  const today = new Date();
  const in7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

  const learningCount = studentsWithProgress.filter((student) => student.progress?.status === "learning").length;
  const reviewingCount = studentsWithProgress.filter((student) => student.progress?.status === "reviewing").length;
  const completedCount = studentsWithProgress.filter((student) => student.progress?.status === "completed").length;

  const overdueStudents = studentsWithProgress.filter((student) => {
    if (!student.progress?.target_completion_date || student.progress.status === "completed") return false;
    return new Date(student.progress.target_completion_date) < today;
  });

  const approachingStudents = studentsWithProgress.filter((student) => {
    if (!student.progress?.target_completion_date || student.progress.status === "completed") return false;
    const targetDate = new Date(student.progress.target_completion_date);
    return targetDate >= today && targetDate <= in7Days;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <PageHeader
          title="Hafızlık Takibi"
          description={`${scope.selectedDepartment.name} bölümündeki hafız öğrencilerin cüz bazlı ilerleme takibi.`}
        />
        <div className="flex gap-2">
          <Link href={`/hafizlik/guncelle?department=${scope.selectedDepartment.id}`} className={buttonVariants()}>
            Toplu Güncelle
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{studentsWithProgress.length}</div>
            <p className="text-sm text-muted-foreground">Hafızlık Kaydı</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{learningCount}</div>
            <p className="text-sm text-muted-foreground">Ã–ğreniyor</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{reviewingCount}</div>
            <p className="text-sm text-muted-foreground">Tekrar Eden</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{completedCount}</div>
            <p className="text-sm text-muted-foreground">Tamamlayan</p>
          </CardContent>
        </Card>
      </div>

      {overdueStudents.length > 0 ? (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-red-900">
              <AlertTriangle className="size-5" />
              <CardTitle className="text-sm">Hedef Tarihi Geçen Ã–ğrenciler</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {overdueStudents.map((student) => {
                const daysOverdue = Math.ceil(
                  (today.getTime() - new Date(student.progress?.target_completion_date ?? today).getTime()) / (1000 * 60 * 60 * 24),
                );

                return (
                  <div key={student.id} className="flex items-center justify-between rounded-md border border-red-200 bg-white px-3 py-2">
                    <div>
                      <Link href={`/talebeler/${student.id}?tab=hafizlik`} className="font-medium text-red-900 hover:underline">
                        {student.full_name}
                      </Link>
                      <span className="ml-2 text-sm text-red-700">{student.course_class?.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-red-600">{daysOverdue} gün geçmiş</span>
                      <Badge variant="destructive">Gecikmiş</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {approachingStudents.length > 0 ? (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-yellow-900">
              <Clock className="size-5" />
              <CardTitle className="text-sm">Hedef Tarihi Yaklaşan Ã–ğrenciler (7 gün)</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {approachingStudents.map((student) => {
                const daysLeft = Math.ceil(
                  (new Date(student.progress?.target_completion_date ?? today).getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
                );

                return (
                  <div key={student.id} className="flex items-center justify-between rounded-md border border-yellow-200 bg-white px-3 py-2">
                    <div>
                      <Link href={`/talebeler/${student.id}?tab=hafizlik`} className="font-medium text-yellow-900 hover:underline">
                        {student.full_name}
                      </Link>
                      <span className="ml-2 text-sm text-yellow-700">{student.course_class?.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-yellow-600">{daysLeft} gün kaldı</span>
                      <Badge variant="outline" className="border-yellow-300 bg-yellow-100 text-yellow-800">
                        Yaklaşıyor
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle>Ã–ğrenci Listesi</CardTitle>
            <form className="flex flex-col gap-2 md:flex-row">
              {scope.canSelectDepartment && scope.departments.length > 1 ? (
                <NativeSelect
                  name="department"
                  defaultValue={scope.selectedDepartment.id}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {scope.departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </NativeSelect>
              ) : null}
               <Input
                name="search"
                placeholder="Ã–ğrenci ara..."
                defaultValue={query.search ?? ""}
                className="w-48"
              />
              <Button type="submit" variant="outline">Ara</Button>
            </form>
          </div>
        </CardHeader>
        <CardContent>
          {studentsWithProgress.length > 0 ? (
            <div className="space-y-4">
              {studentsWithProgress.map((student) => (
                <div key={student.id} className="flex items-center gap-4 rounded-md border border-border p-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Link href={`/talebeler/${student.id}`} className="font-medium hover:underline">
                        {student.full_name}
                      </Link>
                      <span className="text-sm text-muted-foreground">Â· {student.course_class?.name}</span>
                    </div>
                    {student.teacherName ? (
                      <p className="text-sm text-muted-foreground">Sınıf Hocası: {student.teacherName}</p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-32">
                      <div className="flex justify-between text-xs">
                        <span>{student.progress?.current_juz}. Cüz</span>
                        <span>{student.percentage}%</span>
                      </div>
                      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${student.percentage}%` }} />
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        student.progress?.status === "completed" && "bg-green-100 text-green-800",
                        student.progress?.status === "reviewing" && "bg-yellow-100 text-yellow-800",
                        student.progress?.status === "learning" && "bg-blue-100 text-blue-800",
                      )}
                    >
                      {student.progress?.status === "learning"
                        ? "Ã–ğreniyor"
                        : student.progress?.status === "reviewing"
                          ? "Tekrar"
                          : "Tamamlandı"}
                    </Badge>
                    {student.progress?.target_completion_date ? (
                      <span
                        className={cn(
                          "text-xs",
                          new Date(student.progress.target_completion_date) < new Date() && "font-medium text-red-600",
                        )}
                      >
                        Hedef: {new Date(student.progress.target_completion_date).toLocaleDateString("tr-TR")}
                      </span>
                    ) : null}
                    <Link href={`/talebeler/${student.id}?tab=hafizlik`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                      Detay
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title={searchTerm ? "Arama sonucu bulunamadı." : "Bu bölümde hafızlık kaydı olan aktif öğrenci bulunmuyor."} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
