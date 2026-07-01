import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { requireAuth } from "@/lib/auth";
import { getHafizlikProgress, updateHafizlikProgressAction } from "@/lib/hafizlik/actions";
import { getStudentById } from "@/lib/students/queries";

type HafizlikStudentEditPageProps = {
  params: Promise<{ studentId: string }>;
  searchParams: Promise<{ success?: string }>;
};

const JuzOptions = Array.from({ length: 30 }, (_, i) => i + 1);

const statusOptions = [
  { value: "learning", label: "Öğreniyor" },
  { value: "reviewing", label: "Tekrar" },
  { value: "completed", label: "Tamamlandı" },
];

export default async function HafizlikStudentEditPage({ params, searchParams }: HafizlikStudentEditPageProps) {
  const [{ studentId }, query] = await Promise.all([params, searchParams]);
  const { profile } = await requireAuth();

  if (!["admin", "genel_mudur", "bolum_muduru", "hoca"].includes(profile.role)) {
    redirect("/dashboard?error=unauthorized");
  }

  const student = await getStudentById(studentId);
  if (!student) notFound();

  const progressResult = await getHafizlikProgress(studentId);
  const progress = progressResult.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/hafizlik" className={buttonVariants({ variant: "ghost", size: "icon" })}>
          <ArrowLeft className="size-4" />
        </Link>
        <PageHeader
          eyebrow="Hafızlık"
          title={student.full_name}
          description={`${student.department?.name ?? "-"} · ${student.course_class?.name ?? "Sınıf yok"}`}
        />
      </div>

      {query.success ? (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
          Hafızlık kaydı güncellendi.
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{progress ? "Hafızlık İlerlemesini Düzenle" : "Hafızlık Kaydı Oluştur"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateHafizlikProgressAction} className="space-y-6">
            <input type="hidden" name="student_id" value={student.id} />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="current_juz">Cüz</Label>
                <NativeSelect id="current_juz" name="current_juz" defaultValue={progress?.current_juz ?? 1}>
                  {JuzOptions.map((j) => (
                    <option key={j} value={j}>
                      {j}. Cüz
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <div className="space-y-2">
                <Label htmlFor="current_page">Sayfa</Label>
                <Input
                  id="current_page"
                  name="current_page"
                  type="number"
                  min="1"
                  max="604"
                  defaultValue={progress?.current_page ?? 1}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Durum</Label>
                <NativeSelect id="status" name="status" defaultValue={progress?.status ?? "learning"}>
                  {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <div className="space-y-2">
                <Label htmlFor="target_completion_date">Hedef Tarih (Opsiyonel)</Label>
                <Input
                  id="target_completion_date"
                  name="target_completion_date"
                  type="date"
                  defaultValue={progress?.target_completion_date ?? ""}
                  className="h-10"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="teacher_note">Hoca Notu (Opsiyonel)</Label>
                <Input
                  id="teacher_note"
                  name="teacher_note"
                  defaultValue={progress?.teacher_note ?? ""}
                  placeholder="Öğrenci hakkında not..."
                  className="h-10"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Link href="/hafizlik" className={buttonVariants({ variant: "outline" })}>
                İptal
              </Link>
              <FormSubmitButton pendingLabel="Kaydediliyor...">
                {progress ? "Güncelle" : "Oluştur"}
              </FormSubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
