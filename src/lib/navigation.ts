import type { UserRole } from "@/types/rbac";

export type NavigationItem = {
  label: string;
  href: string;
  iconKey: string;
  allowedRoles: UserRole[];
};

export type NavigationGroup = {
  label: string;
  items: NavigationItem[];
};

const staffRoles: UserRole[] = ["admin", "genel_mudur", "bolum_muduru", "hoca"];
const topManagerRoles: UserRole[] = ["admin", "genel_mudur"];
const parentManagerRoles: UserRole[] = ["admin", "genel_mudur", "bolum_muduru", "hoca"];
const allRoles: UserRole[] = ["admin", "genel_mudur", "bolum_muduru", "hoca", "veli"];
const libraryRoles: UserRole[] = ["admin", "genel_mudur", "kutuphane_gorevlisi", "bolum_muduru", "hoca"];
const guidanceRoles: UserRole[] = ["admin", "genel_mudur", "rehberlik", "bolum_muduru", "hoca"];

export const moduleGroups: NavigationGroup[] = [
  {
    label: "Genel",
    items: [
      { label: "Dashboard", href: "/dashboard", iconKey: "dashboard", allowedRoles: staffRoles },
      { label: "Veli Paneli", href: "/veli", iconKey: "home", allowedRoles: ["veli"] },
      { label: "Talebeler", href: "/talebeler", iconKey: "students", allowedRoles: staffRoles },
      { label: "Veliler", href: "/veliler", iconKey: "users", allowedRoles: parentManagerRoles },
      { label: "Hocalar", href: "/hocalar", iconKey: "teachers", allowedRoles: staffRoles },
      { label: "Bölümler", href: "/bolumler", iconKey: "departments", allowedRoles: staffRoles },
      { label: "Sınıflar", href: "/siniflar", iconKey: "classes", allowedRoles: staffRoles },
    ],
  },
  {
    label: "Akademik",
    items: [
      { label: "Not Sistemi", href: "/not-sistemi", iconKey: "grades", allowedRoles: staffRoles },
      { label: "Eğitim Planlama", href: "/egitim-planlama", iconKey: "calendar", allowedRoles: staffRoles },
      { label: "Kanaat Sistemi", href: "/kanaat-sistemi", iconKey: "evaluations", allowedRoles: staffRoles },
      { label: "Yoklama", href: "/yoklama", iconKey: "attendance", allowedRoles: staffRoles },
      { label: "Yatakhane Yönetimi", href: "/yatakhane", iconKey: "dormitory", allowedRoles: staffRoles },
      { label: "Revir Sistemi", href: "/revir", iconKey: "infirmary", allowedRoles: staffRoles },
      { label: "Kütüphane", href: "/kutuphane", iconKey: "library", allowedRoles: libraryRoles },
      { label: "Rehberlik", href: "/rehberlik", iconKey: "guidance", allowedRoles: guidanceRoles },
    ],
  },
  {
    label: "Yönetim",
    items: [
      { label: "Duyurular", href: "/duyurular", iconKey: "announcements", allowedRoles: staffRoles },
      { label: "Evrak Yönetimi", href: "/evraklar", iconKey: "documents", allowedRoles: staffRoles },
      { label: "Audit Log", href: "/audit-log", iconKey: "audit", allowedRoles: staffRoles },
      { label: "Raporlar", href: "/raporlar", iconKey: "evaluations", allowedRoles: allRoles },
      { label: "PDF Merkezi", href: "/raporlar/talebeler", iconKey: "documents", allowedRoles: allRoles },
      { label: "Kullanıcılar", href: "/kullanicilar", iconKey: "users", allowedRoles: topManagerRoles },
      { label: "Ayarlar", href: "/ayarlar", iconKey: "settings", allowedRoles: ["admin"] },
    ],
  },
];

export { getDefaultPathForRole, getRouteAllowedRoles, roleLabels } from "@/lib/route-permissions";

export function getNavigationForRole(role: UserRole): NavigationGroup[] {
  return moduleGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.allowedRoles.includes(role)),
    }))
    .filter((group) => group.items.length > 0);
}
