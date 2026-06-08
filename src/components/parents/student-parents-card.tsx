import Link from "next/link";

import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { ProfileAvatar } from "@/components/profiles/profile-avatar";
import { ActiveBadge, AuthBadge } from "@/components/profiles/profile-status-badge";
import { parentRelationLabels, type ParentRelation } from "@/lib/parents/constants";
import type { StudentParentLinkProfile } from "@/lib/parents/queries";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StudentParentsCardProps = {
  studentId: string;
  parents: StudentParentLinkProfile[];
  availableParents: Array<{ id: string; full_name: string; email: string | null; phone: string | null }>;
  canManage: boolean;
  linkAction: (formData: FormData) => void | Promise<void>;
};

export function StudentParentsCard({ studentId, parents, availableParents, canManage, linkAction }: StudentParentsCardProps) {
  const defaultRelation: ParentRelation = "Baba";

  return (
    <Card>
      <CardHeader className="gap-3 md:flex-row md:items-center md:justify-between">
        <CardTitle>Veliler</CardTitle>
        {canManage ? (
          <Link href={`/veliler/yeni?studentId=${studentId}`} className={cn(buttonVariants({ variant: "secondary" }))}>
            Yeni Veli Oluştur
          </Link>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {canManage ? (
          <form action={linkAction} className="grid gap-3 rounded-md border border-border bg-background p-4 md:grid-cols-[minmax(0,1fr)_180px_auto]">
            <input type="hidden" name="student_id" value={studentId} />
            <select name="parent_profile_id" defaultValue={availableParents[0]?.id ?? ""} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              {availableParents.length > 0 ? (
                availableParents.map((parent) => (
                  <option key={parent.id} value={parent.id}>
                    {parent.full_name} - {parent.email ?? parent.phone ?? "İletişim bilgisi yok"}
                  </option>
                ))
              ) : (
                <option value="">Bağlanabilecek veli yok</option>
              )}
            </select>
            <select name="relation" defaultValue={defaultRelation} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              {Object.entries(parentRelationLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <FormSubmitButton pendingLabel="Bağlanıyor...">Veli Bağla</FormSubmitButton>
          </form>
        ) : null}

        {parents.length > 0 ? (
          parents.map((parent) => (
            <div key={parent.id} className="rounded-md border border-border bg-background p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <ProfileAvatar name={parent.full_name} photoUrl={parent.photo_url} />
                  <div>
                    <p className="font-medium">{parent.full_name}</p>
                    <p className="text-sm text-muted-foreground">{parent.email ?? parent.phone ?? "İletişim bilgisi yok"}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md border border-border bg-card px-2 py-1 text-xs text-muted-foreground">
                    {parent.relation && parent.relation in parentRelationLabels
                      ? parentRelationLabels[parent.relation as keyof typeof parentRelationLabels]
                      : parent.relation ?? "Yakınlık yok"}
                  </span>
                  <AuthBadge authUserId={parent.auth_user_id} />
                  <ActiveBadge isActive={parent.is_active} />
                  <Link href={`/veliler/${parent.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                    Detayı Aç
                  </Link>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">Bu talebeye bağlı veli hesabı yok.</p>
        )}
      </CardContent>
    </Card>
  );
}
