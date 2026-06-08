import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { parentRelationLabels, type ParentRelation } from "@/lib/parents/constants";
import type { ParentProfileDetail, ParentVisibleStudent } from "@/lib/parents/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type ParentLinkManagerProps = {
  parent: ParentProfileDetail;
  availableStudents: ParentVisibleStudent[];
  addAction: (formData: FormData) => void | Promise<void>;
  removeAction: (formData: FormData) => void | Promise<void>;
};

export function ParentLinkManager({ parent, availableStudents, addAction, removeAction }: ParentLinkManagerProps) {
  const defaultRelation: ParentRelation = "Baba";

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Talebe Bağla</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={addAction} className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto]">
            <input type="hidden" name="parent_profile_id" value={parent.id} />
            <select name="student_id" defaultValue={availableStudents[0]?.id ?? ""} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              {availableStudents.length > 0 ? (
                availableStudents.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.full_name} - {student.department?.name ?? "Bölüm yok"} / {student.course_class?.name ?? "Sınıf yok"}
                  </option>
                ))
              ) : (
                <option value="">Bağlanabilecek talebe yok</option>
              )}
            </select>
            <select name="relation" defaultValue={defaultRelation} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              {Object.entries(parentRelationLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <FormSubmitButton pendingLabel="Bağlanıyor...">Talebe Bağla</FormSubmitButton>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mevcut Bağlantılar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {parent.linked_students.length > 0 ? (
            parent.linked_students.map((student) => (
              <div key={student.id} className="flex flex-col gap-3 rounded-md border border-border bg-background p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium">{student.full_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {student.department?.name ?? "Bölüm yok"} · {student.course_class?.name ?? "Sınıf yok"} ·{" "}
                    {student.relation && student.relation in parentRelationLabels
                      ? parentRelationLabels[student.relation as keyof typeof parentRelationLabels]
                      : student.relation ?? "Yakınlık yok"}
                  </p>
                </div>
                <form action={removeAction}>
                  <input type="hidden" name="parent_profile_id" value={parent.id} />
                  <input type="hidden" name="student_id" value={student.id} />
                  <input type="hidden" name="relation" value={student.relation ?? "Baba"} />
                  <Button type="submit" variant="destructive">
                    Talebe Bağını Kaldır
                  </Button>
                </form>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Bu veliye bağlı talebe yok.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
