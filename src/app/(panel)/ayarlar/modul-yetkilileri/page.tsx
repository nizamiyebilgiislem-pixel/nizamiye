import { requireRole } from "@/lib/auth";
import { getModuleAssignees, getAssignableModuleProfiles } from "@/lib/module-assignments/queries";
import { ModuleAssignmentManager } from "./module-assignment-manager";

export default async function ModuleAssignmentsPage() {
  const { profile } = await requireRole(["admin", "genel_mudur"]);

  const [guidanceAssignees, libraryAssignees, infirmaryAssignees, assignableProfiles] = await Promise.all([
    getModuleAssignees("guidance"),
    getModuleAssignees("library"),
    getModuleAssignees("infirmary"),
    getAssignableModuleProfiles(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-[#093657]">Modül Yetkilileri</h1>
        <p className="text-sm text-muted-foreground">
          Rehberlik, kütüphane ve revir modülleri için yetkili personel atayın.
        </p>
      </div>

      <ModuleAssignmentManager
        moduleKey="guidance"
        moduleLabel="Rehberlik"
        assignees={guidanceAssignees}
        profiles={assignableProfiles}
        assignActionLabel="Rehberlik Yetkilisi Ata"
        emptyMessage="Henüz rehberlik yetkilisi atanmamış."
        profile={profile}
      />

      <ModuleAssignmentManager
        moduleKey="library"
        moduleLabel="Kütüphane"
        assignees={libraryAssignees}
        profiles={assignableProfiles}
        assignActionLabel="Kütüphane Yetkilisi Ata"
        emptyMessage="Henüz kütüphane yetkilisi atanmamış."
        profile={profile}
      />

      <ModuleAssignmentManager
        moduleKey="infirmary"
        moduleLabel="Revir"
        assignees={infirmaryAssignees}
        profiles={assignableProfiles}
        assignActionLabel="Revir Yetkilisi Ata"
        emptyMessage="Henüz revir yetkilisi atanmamış."
        profile={profile}
      />
    </div>
  );
}
