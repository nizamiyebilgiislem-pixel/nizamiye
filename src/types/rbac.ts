export const roles = ["admin", "genel_mudur", "bolum_muduru", "hoca", "veli"] as const;

export type UserRole = (typeof roles)[number];

export const departments = ["arapca", "iptida", "hafizlik", "proje"] as const;

export type Department = (typeof departments)[number];

export const studentStatuses = ["active", "passive", "graduated", "left"] as const;

export type StudentStatus = (typeof studentStatuses)[number];

export type RoutePermission = {
  path: string;
  roles: UserRole[];
};

export type ProfileRole = UserRole;
