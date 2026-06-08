import { Badge } from "@/components/ui/badge";
import { roleLabels } from "@/lib/route-permissions";
import type { UserRole } from "@/types/rbac";

export function ProfileRoleBadge({ role }: { role: UserRole }) {
  return <Badge variant="outline">{roleLabels[role]}</Badge>;
}

export function ActiveBadge({ isActive }: { isActive: boolean }) {
  return <Badge variant={isActive ? "default" : "outline"}>{isActive ? "Aktif" : "Pasif"}</Badge>;
}

export function AuthBadge({ authUserId }: { authUserId: string | null }) {
  return <Badge variant={authUserId ? "default" : "outline"}>{authUserId ? "Bağlı" : "Bağlı değil"}</Badge>;
}
