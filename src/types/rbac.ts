export const activeRoles = ["admin", "genel_mudur", "bolum_muduru", "kutuphane_gorevlisi", "hoca", "veli", "sponsor", "rehberlik", "destek_birim_muduru"] as const;
export const legacyRoles = ["muhasebe"] as const;

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
