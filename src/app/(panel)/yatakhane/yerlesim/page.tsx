import Link from "next/link";
import { redirect } from "next/navigation";

import { DormitoryAssignmentTable } from "@/components/dormitory/dormitory-assignment-table";
import { StudentCompactCard } from "@/components/students/student-compact-card";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireAuth } from "@/lib/auth";
import { canManageDormitoryAssignments, canViewDormitoryModule } from "@/lib/dormitory/permissions";
import { getDormitoryAssignments, getDormitorySelectionOptions } from "@/lib/dormitory/queries";
import { cn } from "@/lib/utils";

type DormitoryPlacementPageProps = {
  searchParams: Promise<{
    departmentId?: string;
    classId?: string;
    dormitoryId?: string;
    floorId?: string;
    roomId?: string;
    status?: "active" | "ended" | "all";
    unassigned?: string;
    search?: string;
  }>;
};

export default async function DormitoryPlacementPage({ searchParams }: DormitoryPlacementPageProps) {
  const { profile } = await requireAuth();
  if (!canViewDormitoryModule(profile)) {
    redirect("/veli");
  }

  const query = await searchParams;
  const filters = {
    departmentId: query.departmentId,
    classId: query.classId,
    dormitoryId: query.dormitoryId,
    floorId: query.floorId,
    roomId: query.roomId,
    status: query.status ?? "active",
    search: query.search,
  };

  const [assignments, options] = await Promise.all([getDormitoryAssignments(profile, filters), getDormitorySelectionOptions(profile)]);
  const activeAssignments = assignments.filter((assignment) => assignment.status === "active");
  const unassignedStudentIds = new Set(activeAssignments.map((assignment) => assignment.student_id));
  const showUnassigned = query.unassigned === "true";
  const canManage = canManageDormitoryAssignments(profile);
  const searchTerm = (query.search ?? "").trim().toLocaleLowerCase("tr-TR");
  const unassignedStudents = options.students.filter((student) => {
    if (student.status !== "active" || unassignedStudentIds.has(student.id)) {
      return false;
    }

    if (!searchTerm) {
      return true;
    }

    const haystack = [student.full_name, student.department?.name ?? "", student.course_class?.name ?? ""].join(" ").toLocaleLowerCase("tr-TR");
    return haystack.includes(searchTerm);
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Yatakhane"
        title="Yerleşim"
        description="Aktif yerleşimleri ve yataksız talebeleri aynı ekranda takip edin."
      />

      <div className="flex flex-wrap gap-2">
        {canManage ? (
          <Link href="/yatakhane/yerlesim/yeni" className={cn(buttonVariants({ size: "sm" }))}>
            Yeni Yerleşim
          </Link>
        ) : null}
        <Link href="/yatakhane/raporlar" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          Raporlar
        </Link>
      </div>

      <FilterBar query={query} options={options} />

      {showUnassigned ? (
        <Card>
          <CardHeader className="border-b border-border">
            <CardTitle>Yataksız Aktif Talebeler</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {unassignedStudents.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {unassignedStudents.map((student) => (
                  <StudentCompactCard key={student.id} student={student} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Yataksız aktif talebe bulunmuyor.</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <DormitoryAssignmentTable items={assignments} showActions={canManage} />
      )}
    </div>
  );
}

function FilterBar({
  query,
  options,
}: {
  query: {
    departmentId?: string;
    classId?: string;
    dormitoryId?: string;
    floorId?: string;
    roomId?: string;
    status?: "active" | "ended" | "all";
    unassigned?: string;
    search?: string;
  };
  options: Awaited<ReturnType<typeof getDormitorySelectionOptions>>;
}) {
  return (
    <Card>
      <CardHeader className="border-b border-border">
        <CardTitle>Filtreler</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        <form method="get" className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Input name="search" defaultValue={query.search ?? ""} placeholder="Talebe adı / oda no / yatak no" />
          <select name="departmentId" defaultValue={query.departmentId ?? ""} className="h-10 rounded-md border border-border bg-background px-3 text-sm">
            <option value="">Bölüm</option>
            {options.departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
          <select name="classId" defaultValue={query.classId ?? ""} className="h-10 rounded-md border border-border bg-background px-3 text-sm">
            <option value="">Sınıf</option>
            {options.classes.map((courseClass) => (
              <option key={courseClass.id} value={courseClass.id}>
                {courseClass.name}
              </option>
            ))}
          </select>
          <select name="dormitoryId" defaultValue={query.dormitoryId ?? ""} className="h-10 rounded-md border border-border bg-background px-3 text-sm">
            <option value="">Yatakhane</option>
            {options.dormitories.map((dormitory) => (
              <option key={dormitory.id} value={dormitory.id}>
                {dormitory.name}
              </option>
            ))}
          </select>
          <select name="floorId" defaultValue={query.floorId ?? ""} className="h-10 rounded-md border border-border bg-background px-3 text-sm">
            <option value="">Kat</option>
            {options.floors.map((floor) => (
              <option key={floor.id} value={floor.id}>
                {floor.name}
              </option>
            ))}
          </select>
          <select name="roomId" defaultValue={query.roomId ?? ""} className="h-10 rounded-md border border-border bg-background px-3 text-sm">
            <option value="">Oda</option>
            {options.rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name}
              </option>
            ))}
          </select>
          <select name="status" defaultValue={query.status ?? "active"} className="h-10 rounded-md border border-border bg-background px-3 text-sm">
            <option value="active">Aktif</option>
            <option value="ended">Sonlandırıldı</option>
            <option value="all">Tümü</option>
          </select>
          <label className="flex items-center gap-2 rounded-md border border-border px-3 text-sm">
            <input type="checkbox" name="unassigned" value="true" defaultChecked={query.unassigned === "true"} className="size-4 rounded border-border" />
            Yataksız talebeler
          </label>
          <div className="flex items-center gap-2 xl:col-span-4">
            <button type="submit" className={cn(buttonVariants({ size: "sm" }))}>
              Filtrele
            </button>
            <Link href="/yatakhane/yerlesim" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              Sıfırla
            </Link>
          </div>
        </form>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">Talebe: {options.students.length}</Badge>
          <Badge variant="outline">Yatakhane: {options.dormitories.length}</Badge>
          <Badge variant="outline">Oda: {options.rooms.length}</Badge>
          <Badge variant="outline">Yatak: {options.beds.length}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
