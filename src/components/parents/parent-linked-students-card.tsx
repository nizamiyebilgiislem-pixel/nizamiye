import Link from "next/link";

import { StudentAvatar } from "@/components/students/student-avatar";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { parentRelationLabels } from "@/lib/parents/constants";
import type { ParentProfileDetail } from "@/lib/parents/queries";
import { cn } from "@/lib/utils";

type ParentLinkedStudentsCardProps = {
  parent: ParentProfileDetail;
  showManageButton?: boolean;
};

export function ParentLinkedStudentsCard({ parent, showManageButton }: ParentLinkedStudentsCardProps) {
  return (
    <Card>
      <CardHeader className="gap-3 md:flex-row md:items-center md:justify-between">
        <CardTitle>Bağlı Talebeler</CardTitle>
        {showManageButton ? (
          <Link href={`/veliler/${parent.id}/talebeler`} className={cn(buttonVariants({ variant: "secondary" }))}>
            Talebe Bağlantılarını Yönet
          </Link>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        {parent.linked_students.length > 0 ? (
          parent.linked_students.map((student) => (
            <div key={student.id} className="flex flex-col gap-3 rounded-md border border-border bg-background p-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <StudentAvatar name={student.full_name} photoUrl={student.photo_url} />
                <div>
                  <p className="font-medium">{student.full_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {student.department?.name ?? "Bölüm yok"} · {student.course_class?.name ?? "Sınıf yok"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-md border border-border bg-card px-2 py-1 text-xs text-muted-foreground">
                  {student.relation && student.relation in parentRelationLabels
                    ? parentRelationLabels[student.relation as keyof typeof parentRelationLabels]
                    : student.relation ?? "Yakınlık yok"}
                </span>
                <Link href={`/talebeler/${student.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                  Detayı Aç
                </Link>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">Bu veli profiline bağlı görünür talebe bulunmuyor.</p>
        )}
      </CardContent>
    </Card>
  );
}
