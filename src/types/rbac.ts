export const activeRoles = ["admin", "genel_mudur", "yonetim", "bolum_muduru", "kutuphane_gorevlisi", "hoca", "veli", "sponsor", "rehberlik", "destek_birim_muduru"] as const;
export const legacyRoles = ["muhasebe"] as const;

export const globalViewRoles = ["admin", "genel_mudur", "yonetim"] as const;
export const globalManageRoles = ["admin", "genel_mudur"] as const;

export const roles = activeRoles;

export type ActiveUserRole = (typeof activeRoles)[number];
export type LegacyUserRole = (typeof legacyRoles)[number];
export type UserRole = ActiveUserRole | LegacyUserRole;

export const departments = ["arapca", "iptida", "hafizlik", "proje"] as const;

export type Department = (typeof departments)[number];

export const studentStatuses = ["active", "passive", "graduated", "left"] as const;

export type StudentStatus = (typeof studentStatuses)[number];

export type RoutePermission = {
  path: string;
  roles: UserRole[];
};

export type ProfileRole = UserRole;

export function isGlobalViewRole(role: string) {
  return (globalViewRoles as readonly string[]).includes(role);
}

export function isGlobalManageRole(role: string) {
  return (globalManageRoles as readonly string[]).includes(role);
}
